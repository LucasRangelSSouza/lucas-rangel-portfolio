# Reliable job queues for AI agents with Redis Streams

### Retries, duplicate submissions and workers that die mid-task: a small state contract, Redis consumer groups to enforce it, and the tests that kill a worker on purpose, from Docker Compose to a three-node Kubernetes cluster

An AI agent call is slow, expensive and easy to repeat by accident. A client times out and retries. A load balancer sends the retry to a different worker. A worker dies after it picked up a job and before it finished. On the first busy day each of these happens, and adding replicas makes all of them more likely.

So before an agent runtime needs an autoscaler, it needs a queue that answers three questions correctly: has this request already run, who is working on it now, and what happens to it if that worker disappears. This article shows the contract I use, how Redis Streams consumer groups enforce it in about forty lines of Python, and the evidence that it holds when processes and pods are killed. The code is in [distributed-agent-runtime-lab](https://github.com/LucasRangelSSouza/distributed-agent-runtime-lab).

> **What the tests showed**
> - A request sent twice with the same ID ran once; the second call returned the stored answer.
> - A worker killed while holding a job: another worker reclaimed it and finished it, with nothing lost and nothing run twice.
> - The same behaviour on a three-node `kind` cluster after scaling workers down, up, and deleting a pod.

## The contract

A request is queued, processing or completed. The first completed answer becomes the answer to every later submission with the same request ID, whichever worker handles it.

![Request states](d11_request_states.png)
*A failure sends a request back to the queue and releases the failed worker. A completed request is final.*

| Rule | Why |
|---|---|
| A completed request ID returns the stored answer, flagged `cache_hit: true` | a retry after a client timeout must not run the agent twice |
| A worker acknowledges a job only after its result is stored | a crash between "done" and "saved" must leave the job recoverable |
| A job held too long by a silent worker can be claimed by another | a dead worker can't keep work hostage |

A load balancer can't give you any of these. It routes a request to a healthy backend; it doesn't remember that the request already ran, and it can't recover work a backend accepted and abandoned.

## How Redis Streams enforces it

The gateway writes an idempotency record for each request ID and appends the job to a Redis Stream. Workers read the stream through a **consumer group**, which tracks, for every entry, which consumer received it and whether it was acknowledged. An entry delivered but never acknowledged stays in the group's pending list. That pending list is what makes recovery possible.

The worker loop in [`runtime_lab/worker.py`](https://github.com/LucasRangelSSouza/distributed-agent-runtime-lab/blob/main/runtime_lab/worker.py) does three things:

```python
def process_once(self, block_ms=1_000):
    # ">" means: only entries never delivered to any consumer of this group
    batches = self.state.client.xreadgroup(GROUP, self.consumer, {stream: ">"}, count=1, block=block_ms)
    if not batches:
        return False
    _, entries = batches[0]
    entry_id, fields = entries[0]
    self._complete_and_ack(stream, entry_id, fields)
    return True

def recover_once(self, minimum_idle_ms=1_000):
    # take over one entry that another consumer received but hasn't acknowledged for minimum_idle_ms
    _cursor, entries, _deleted = self.state.client.xautoclaim(stream, GROUP, self.consumer, minimum_idle_ms, "0-0", count=1)
    if not entries:
        return False
    entry_id, fields = entries[0]
    self._complete_and_ack(stream, entry_id, fields)
    return True

def _complete_and_ack(self, stream, entry_id, fields):
    current = self.state.get_request(fields["request_id"])
    if current["status"] != "completed":                     # idempotent: a reclaimed job may already be done
        self.state.complete(fields["request_id"], self.consumer, run_agent(fields["message"]), int(current["attempts"]) + 1)
    self.state.client.xack(stream, GROUP, entry_id)          # acknowledge only after the result is stored
```

Two details carry the guarantees. `XAUTOCLAIM` with a minimum idle time turns "a worker died" into "the job becomes claimable after one second of silence", with no heartbeat protocol to write. And the status check before completing makes the reclaim safe: if the first worker stored its result and died just before `XACK`, the second worker sees `completed`, skips the work and only acknowledges.

Pick the idle time from your slowest legitimate job. Too short, and a slow but healthy worker gets its job stolen and the agent runs twice; too long, and recovery waits.

## Evidence 1: kill a worker in Docker Compose

```bash
git clone https://github.com/LucasRangelSSouza/distributed-agent-runtime-lab && cd distributed-agent-runtime-lab
python -m pip install -e . && npm --prefix frontend ci
make check
docker compose up --build --detach
```

Open `http://localhost:8080`, send a message, then send a different message with the same request ID: the interface returns the first answer and marks it as a replay. The API exposes `POST /api/messages`, `GET /api/requests/{request_id}` and `GET /api/conversations/{conversation_id}` if you prefer to check without the interface.

The recovery test is the convincing part. I gave one worker a three-second processing delay, sent a request, and Redis reported one pending entry. I killed that worker before it could acknowledge. A replacement reclaimed the idle entry and completed it, and Redis reported zero pending entries. The request finished once, with an attempt count of 1. After recreating the gateway container, a request with an existing ID still returned the same result with `state_backend: redis`: the idempotency record lives in Redis, not in a process.

## Evidence 2: the same on Kubernetes

The same runtime ran on a local `kind` cluster with a control plane and two worker nodes:

```bash
kind create cluster --name runtime-lab --config k8s/kind-config.yaml --wait 2m
docker build --tag distributed-agent-runtime-lab-runtime:latest .
kind load docker-image distributed-agent-runtime-lab-runtime:latest --name runtime-lab
kubectl --context kind-runtime-lab apply -f k8s/local-kind.yaml
kubectl --context kind-runtime-lab rollout status deployment/agent-workers --timeout=120s
```

Posting the same request ID twice ran it once and replayed it once (`cache_hit: true`). Then I scaled workers to one, back to two, and deleted a worker pod; requests sent after each change completed, the conversation kept its history, and the deployment restored two workers, one per node.

One trap: the default `kind` node image at the time had a kubelet that refused my host's cgroup v1 setup and silently removed the half-built cluster. The profile pins `kindest/node:v1.31.4`, and the repository records the failed attempt next to the working one.

## A benchmark, read for what it is

One Docker host ran Redis, a gateway and two workers. 48 unique requests at concurrency 6: all completed, no errors, 61.89 requests per second, p50 latency 56.88 ms and p95 147.95 ms, 24 requests per worker, and zero pending entries and zero lag on the stream at the end.

```bash
.\scripts\run_compose_benchmark.ps1 -RequestCount 48 -Concurrency 6
docker compose exec -T redis redis-cli XINFO GROUPS runtime-lab:agent-runs
```

The last command is the check that matters: zero pending and zero lag mean every delivered job was acknowledged. The workers run a stub model, so the throughput measures the queue path (HTTP, stream dispatch, completion, polling) and nothing about agent capacity. Don't quote it as one.

## What this doesn't prove

The repository validates Terraform for GKE and EKS without planning or applying it. Autoscaling under queue pressure, recovery time, behaviour at saturation, and Redis durability settings for production are all unmeasured here. Redis is the state store for a reference runtime; a production system holding paid work should decide its persistence (AOF, replicas) deliberately.

## The habit

Write the test that kills a worker before writing the scaling story. It costs an afternoon, and autoscaling only multiplies whatever the runtime already does, so it had better be correct first.
