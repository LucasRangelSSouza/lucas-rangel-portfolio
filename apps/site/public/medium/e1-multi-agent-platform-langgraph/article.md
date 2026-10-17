# How to build a multi-agent platform with LangGraph

### A supervisor that talks to the user and calls specialist agents as tools, SQL over eight database engines with writes behind an allow-list, MCP integrations, and the limits that keep a turn from running away

Most multi-agent examples are a notebook: three agents passing messages until one says "done". A platform that several companies use every day needs different things. Each customer configures its own agents. The agents read the customer's databases, and some must write to them. Conversations run for weeks. And nobody can afford a turn that loops forty times calling tools.

This is the architecture of the platform I built for that, with LangGraph as the runtime. The kernel that runs the agents is open source at [RangelTech/kernel-llm](https://github.com/RangelTech/kernel-llm), and the backend and interface around it at [RangelTech/agent-platform](https://github.com/RangelTech/agent-platform).

> **The design in one paragraph**
> One supervisor node talks to the user. Every specialist agent is exposed to the supervisor as a tool that takes one self-contained task. Only the user and assistant messages are checkpointed in Postgres; the tool calls inside a turn are ephemeral. Database access is read-only by default, writes go only to tables a template allows, and every turn has hard limits on tool calls. In a homologation suite of 24 scenarios across three model providers, 22 passed.

![Architecture: backend, kernel, supervisor and specialists](fig1_architecture.png)
*The backend owns identity, tenants, templates, secrets and files, and never calls a model. The kernel owns the conversation.*

## Specialists as tools, not as a graph of agents

The first decision is the topology. LangGraph lets you draw any graph: agents as nodes, edges between them, conditional routing. I tried richer graphs and came back to the simplest one that works for a chat product:

```python
def build_graph(checkpointer):
    graph = StateGraph(RunState)
    graph.add_node("supervisor", _supervisor_node)
    graph.add_edge(START, "supervisor")
    graph.add_edge("supervisor", END)
    return graph.compile(checkpointer=checkpointer)
```

One node. The supervisor is the only agent that sees the conversation and the only one that answers the user. Each specialist becomes a function the supervisor can call:

```python
def _agent_tool_defs(agents):
    return [{"type": "function", "function": {
        "name": agent["name"],
        "description": _descricao_do_especialista(agent),   # what the supervisor reads to decide whom to ask
        "parameters": {"type": "object", "required": ["task"],
                       "properties": {"task": {"type": "string",
                           "description": "A complete, self-contained task for this specialist."}}}}}
            for agent in agents]
```

Agents-as-tools has three properties that matter in production. The routing is the model's normal tool calling, which every provider supports, so there is no custom router to maintain. A specialist receives only its task, not the whole conversation, which keeps its context short and its cost low. And the user always talks to one voice: specialists report back to the supervisor, never to the user.

The cost of that last property is that the supervisor must know what each specialist can do from its description alone. That bit us: when someone attached documents to a specialist, the supervisor kept answering "I have no access to internal documents", because the description didn't say otherwise. The kernel now appends to the description that the specialist can answer from N attached documents. The supervisor decides from text, so the text has to be complete.

## Checkpoint the conversation, not the tool loop

LangGraph's `AsyncPostgresSaver` persists the graph state per conversation thread, so a conversation survives restarts and resumes on any replica. What you put in that state decides how much every later turn costs. The kernel checkpoints only the user and assistant messages. The specialists' tool calls (the SQL queries, the document searches, the retries) run inside the turn and are recorded in a separate `tool_calls` table for tracing, not in the history the model reads.

Long conversations still grow. Each template sets a history limit; above it the kernel keeps the most recent half intact and either drops the older half or, if the template enables it, replaces it with a summary written by the model and told to keep facts, numbers, decisions and open items rather than prose:

```python
if len(messages) > limit:
    recent, older = messages[-limit // 2:], messages[:-limit // 2]
    summary = await summarize(older) if run_config.get("compress_history") else None
    messages = ([("summary", summary)] if summary else []) + recent
```

The summary call can fail without failing the turn: it is an improvement, not a requirement.

## Data access: read by default, write by exception

Most of the value of these agents is answering from the customer's own data. The kernel connects to eight engines (Postgres, MySQL, SQLite, SQL Server, Oracle, Firebird, BigQuery and MongoDB), and the guardrails are code, not prompt:

- **Reads open a read-only connection** (`conn.read_only = True` on Postgres, the equivalent elsewhere) and only `SELECT` or `WITH` statements pass.
- **Writes are a separate tool**, enabled per agent, that accepts a single `INSERT`, `UPDATE` or `DELETE`, refuses DDL, refuses `UPDATE` or `DELETE` without `WHERE`, and only targets tables on the template's allow-list:

```python
def validate_write(statement, allowed_tables):
    body = statement.strip().rstrip(";")
    if ";" in body:
        raise ValueError("one statement per call")
    if first_word in ("update", "delete") and not re.search(r"\bwhere\b", body, re.I):
        raise ValueError(f"{first_word.upper()} without WHERE is forbidden")
    if target_table not in allowed:
        raise ValueError(f"table '{target_table}' is not on this template's write list")
```

- **Writes can require confirmation.** With `require_write_confirmation`, the agent proposes the statement and the user approves it before it runs.
- **Credentials never reach the kernel in a template.** The backend decrypts the datasource secret only when it builds the payload for one run.

## Tools, files and integrations

Beyond SQL, specialists get tools from two places. A built-in catalog covers what most templates need: generating charts, spreadsheets and PDFs as artifacts the interface renders, searching documents uploaded to the agent (chunked and embedded at upload time), and long-term memory extracted from past conversations. External tools come through MCP servers configured per agent, so connecting a new system means pointing a template at its MCP server instead of writing a new tool.

Artifacts raised one more coordination problem. A specialist that creates a chart sends it straight to the user's screen, but the supervisor only receives the specialist's text. Without a note, the supervisor would describe a chart the user is already looking at, or promise to make one that exists. The kernel now tells the supervisor which artifacts already appeared.

## Limits that make runaway turns impossible

An agent that can call tools can call them forever. Three limits apply to every turn:

| Limit | What it stops |
|---|---|
| tool calls per turn, across all specialists | a supervisor that keeps delegating |
| tool rounds per specialist | a specialist retrying the same failing query |
| size of each tool output returned to the model | a `SELECT *` that floods the context |

The per-turn counter lives in the run configuration because it is the one object every specialist of that turn sees. When the limit is reached the agent answers with what it has and says the limit was hit, instead of failing silently.

## Tenants, templates and versions

The backend, not the kernel, knows about customers. Each tenant has its users, permission profiles, secrets, datasources, files and templates. A template is a supervisor plus N specialists, each with its own prompt, model, tools, files, datasources and write list, and versions are immutable: editing creates a new version and deploying makes it active, so a conversation can always be traced to the exact configuration that answered it. Each tenant brings its own model provider keys.

## Does it work?

The repository ships a homologation harness that runs scenarios against real models: query a database and chart the result, answer from an attached document, write to an allow-listed table with confirmation, refuse a write to a table off the list, hold a long conversation. In the last full run, 22 of 24 scenarios passed, with models from three providers (Gemini, OpenAI and Anthropic). One failure was a model provider left unconfigured in the test environment; the other is recorded case by case in the results file. That record is the point of the harness: a model change is checked against the same scenarios before a template moves to it.

## What I would do differently

- Put the specialist descriptions under test from day one. Routing quality depends on them more than on any prompt.
- Start with the per-turn tool limit on. We added it after the first runaway turn, not before.
- Decide the history policy per template early. Truncation is cheap and loses the start; summaries keep the sense and cost a call; neither is right for every product.

## Run it

```bash
git clone https://github.com/RangelTech/kernel-llm && cd kernel-llm
pip install -r requirements-dev.txt
pytest -q                                   # the test schema is self-contained
DATABASE_URL=postgresql://agent:agent@localhost:5433/agent_llm uvicorn app.main:app --port 8080
```

The backend and the React interface that create tenants, templates and chats are in [RangelTech/agent-platform](https://github.com/RangelTech/agent-platform), with a `docker-compose.yml` that runs Postgres, the kernel and the backend together.
