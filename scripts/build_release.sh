#!/usr/bin/env bash
# Build one service image and write its release assets (contract: CONTRATO_RELEASE.md, several services per repo):
#   <service>.image.tar.gz            docker save | gzip -9
#   release-manifest.<service>.json   manifest schema 1
# Usage: scripts/build_release.sh portfolio-web|portfolio-api <version, e.g. v0.1.0> [full commit sha]
set -euo pipefail
cd "$(dirname "$0")/.."
SERVICE="${1:?service: portfolio-web or portfolio-api}"
VERSION="${2:?version, e.g. v0.1.0}"
SHA="${3:-$(git rev-parse HEAD)}"
PY="${PYTHON:-python3}"
command -v "$PY" >/dev/null 2>&1 || PY=python
case "$SERVICE" in
  portfolio-web) DOCKERFILE=docker/web.Dockerfile ;;
  portfolio-api) DOCKERFILE=docker/api.Dockerfile ;;
  *) echo "unknown service $SERVICE" >&2; exit 2 ;;
esac
TAG="$SERVICE:$VERSION"
ARCHIVE="$SERVICE.image.tar.gz"
docker build -f "$DOCKERFILE" --build-arg GIT_COMMIT="$SHA" -t "$TAG" .
docker save "$TAG" | gzip -9 > "$ARCHIVE"
IMAGE_ID="sha256:$(gunzip -c "$ARCHIVE" | tar -xO manifest.json | "$PY" -c "import sys,json,re;print(re.sub(r'^.*/','',json.load(sys.stdin)[0]['Config']).replace('.json','').replace('blobs/sha256/',''))")"
ARCHIVE_SHA="$(sha256sum "$ARCHIVE" | cut -d' ' -f1)"
SERVICE="$SERVICE" VERSION="$VERSION" SHA="$SHA" TAG="$TAG" ARCHIVE="$ARCHIVE" IMAGE_ID="$IMAGE_ID" ARCHIVE_SHA="$ARCHIVE_SHA" "$PY" - <<'PYEOF'
import datetime, json, os

service = os.environ["SERVICE"]
spec = {
    "portfolio-web": {
        "healthcheck": {"path": "/healthz", "expect": 200, "timeout_s": 60, "port": 80},
        "env": {"required": []},
        "resources": {"memory": "128m", "cpus": "0.5"},
    },
    "portfolio-api": {
        "healthcheck": {"path": "/api/health", "expect": 200, "timeout_s": 90, "port": 8080},
        "env": {"required": ["RAG_DATABASE_URL", "RAG_SQL_DATABASE_URL", "FEEDBACK_ADMIN_TOKEN"]},
        "resources": {"memory": "512m", "cpus": "1"},
    },
}[service]
manifest = {
    "schema": 1,
    "service": service,
    "repo": "LucasRangelSSouza/lucas-rangel-portfolio",
    "commit": os.environ["SHA"][:7],
    "version": os.environ["VERSION"],
    "artifact": {
        "type": "docker-archive",
        "asset": os.environ["ARCHIVE"],
        "sha256": os.environ["ARCHIVE_SHA"],
        "image_id": os.environ["IMAGE_ID"],
        "tag": os.environ["TAG"],
    },
    "built_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    **spec,
}
with open(f"release-manifest.{service}.json", "w", newline="\n") as fh:
    json.dump(manifest, fh, indent=2)
    fh.write("\n")
PYEOF
cat "release-manifest.$SERVICE.json"
ls -l "$ARCHIVE"
