#!/usr/bin/env bash
# Local gate (also the CI and release gate): lint + tests, then builds the production images and smoke-tests them
# under the same hardening the stack uses (read-only root, tmpfs, all capabilities dropped, non-root).
# Needs: python 3.10+, node 24 (or 20+), docker. Set SKIP_NODE=1 / SKIP_DOCKER=1 to skip a part.
set -euo pipefail
export MSYS_NO_PATHCONV=1  # Git Bash on Windows must not rewrite /tmp and /data in docker arguments
cd "$(dirname "$0")/.."
PY="${PYTHON:-python3}"
command -v "$PY" >/dev/null 2>&1 || PY=python
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo local)"
WEB_IMG="portfolio-web-verify:local"
API_IMG="portfolio-api-verify:local"
cids=()
cleanup() { for c in "${cids[@]:-}"; do [ -n "$c" ] && docker rm -f "$c" >/dev/null 2>&1 || true; done; [ -n "${VOL:-}" ] && docker volume rm -f "$VOL" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "== api: ruff + pytest"
"$PY" -m pip install -q -r apps/api/requirements-dev.txt
(cd apps/api && "$PY" -m ruff check . && "$PY" -m pytest -q)

if [ "${SKIP_NODE:-0}" != "1" ]; then
  echo "== rag-web: typecheck"
  (cd apps/rag-web && npm ci --no-audit --no-fund --silent && npm run --silent typecheck)
  echo "== site: typecheck + unit tests"
  (cd apps/site && npm ci --no-audit --no-fund --silent && npm run --silent typecheck && npm test --silent)
fi

[ "${SKIP_DOCKER:-0}" = "1" ] && { echo "verify OK (docker skipped)"; exit 0; }

wait_for() { # url [header]
  local url="$1" header="${2:-}"
  for i in $(seq 1 40); do
    if curl -fsS ${header:+-H "$header"} "$url" >/dev/null 2>&1; then return 0; fi
    sleep 1
  done
  echo "no answer from $url" >&2; return 1
}
free_port() { "$PY" -c "import socket;s=socket.socket();s.bind(('127.0.0.1',0));print(s.getsockname()[1]);s.close()"; }

echo "== images"
docker build -q -f docker/web.Dockerfile --build-arg GIT_COMMIT="$COMMIT" -t "$WEB_IMG" .
docker build -q -f docker/api.Dockerfile --build-arg GIT_COMMIT="$COMMIT" -t "$API_IMG" .

echo "== smoke: portfolio-web"
P80="$(free_port)"; P81="$(free_port)"; P8080="$(free_port)"
cid="$(docker run -d --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges:true \
  -p "127.0.0.1:$P80:80" -p "127.0.0.1:$P81:8081" -p "127.0.0.1:$P8080:8080" "$WEB_IMG")"
cids+=("$cid")
wait_for "http://127.0.0.1:$P80/healthz"
[ "$(docker exec "$cid" id -u)" = "101" ] || { echo "web must run as uid 101"; exit 1; }
curl -fsS "http://127.0.0.1:$P8080/healthz" | grep -q ok
curl -fsS -H "Host: lucas.rangeltech.net" "http://127.0.0.1:$P80/" | grep -qi "<html"
curl -fsS -H "Host: lucas.rangeltech.net" "http://127.0.0.1:$P80/articles/" | grep -qi "<html"
curl -fsS -H "Host: rag.rangeltech.net" "http://127.0.0.1:$P80/" | grep -q "Ask the record"
[ "$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: lucas.rangeltech.net' "http://127.0.0.1:$P80/api/explore")" = "404" ]
[ "$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: other.example' "http://127.0.0.1:$P80/")" = "404" ]
curl -fsS "http://127.0.0.1:$P81/healthz" | grep -q ok            # bi proxy (Metabase is not up here: / would be 502)
for i in $(seq 1 30); do [ "$(docker inspect -f '{{.State.Health.Status}}' "$cid")" = "healthy" ] && break; sleep 2; done
[ "$(docker inspect -f '{{.State.Health.Status}}' "$cid")" = "healthy" ] || { echo "web healthcheck not healthy"; docker logs "$cid" | tail; exit 1; }

echo "== smoke: portfolio-api (no Postgres, embeddings off)"
VOL="portfolio-verify-data-$$"; docker volume create "$VOL" >/dev/null
PAPI="$(free_port)"
cid="$(docker run -d --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges:true \
  -v "$VOL:/data" -e EMBED_PROVIDER=none -e RAG_DATABASE_URL="postgresql://nobody:nopass@127.0.0.1:1/none" \
  -e FEEDBACK_ADMIN_TOKEN=verify-token -p "127.0.0.1:$PAPI:8080" "$API_IMG")"
cids+=("$cid")
wait_for "http://127.0.0.1:$PAPI/api/health"
[ "$(docker exec "$cid" id -u)" = "10001" ] || { echo "api must run as uid 10001"; exit 1; }
health="$(curl -fsS "http://127.0.0.1:$PAPI/api/health")"
echo "$health"
echo "$health" | "$PY" -c "import json,sys;h=json.load(sys.stdin);assert h['status']=='degraded' and h['db_unavailable'] is True and h['search_mode']=='lexical' and h['embed_provider']=='none' and h['feedback']=='ok',h"
[ "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PAPI/api/explore?q=merenda")" = "503" ]
curl -fsS "http://127.0.0.1:$PAPI/api/feedback/health" | grep -q '"ok"'
slug="$("$PY" -c "import json;print(json.load(open('apps/site/content/articles.json'))[0]['slug'])")"
curl -fsS "http://127.0.0.1:$PAPI/api/feedback/$slug" | grep -q '"likes":0'
curl -fsS -X POST -H 'content-type: application/json' -d '{"name":"verify","body":"smoke test comment"}' "http://127.0.0.1:$PAPI/api/feedback/$slug/comments" | grep -q 'smoke test comment'
[ "$(curl -s -o /dev/null -w '%{http_code}' -X DELETE "http://127.0.0.1:$PAPI/api/feedback/comments/1")" = "403" ]
for i in $(seq 1 30); do [ "$(docker inspect -f '{{.State.Health.Status}}' "$cid")" = "healthy" ] && break; sleep 2; done
[ "$(docker inspect -f '{{.State.Health.Status}}' "$cid")" = "healthy" ] || { echo "api healthcheck not healthy"; docker logs "$cid" | tail; exit 1; }

echo "verify OK"
