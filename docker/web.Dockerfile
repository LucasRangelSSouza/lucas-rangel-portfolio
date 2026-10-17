# portfolio-web: nginx serving the static site (lucas.), the static RAG UI (rag.) and the Metabase proxy (bi.).
# Both Next apps are built here, so the content is baked into the image (no rsync, no volume).
# Build from the repository root:  docker build -f docker/web.Dockerfile -t portfolio-web .
FROM node:24-alpine AS site
WORKDIR /src/apps/site
COPY apps/site/package.json apps/site/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY apps/site/ ./
RUN npm run build

FROM node:24-alpine AS rag
WORKDIR /src/apps/rag-web
COPY apps/rag-web/package.json apps/rag-web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY apps/rag-web/ ./
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.30.5-alpine@sha256:4714e0b1b2577eaa1a6131d07c958b67f0eb68e6d0521e90c6e5287db8cf0bc5
COPY nginx/default.conf nginx/rag.conf nginx/bi.conf /etc/nginx/conf.d/
COPY --from=site /src/apps/site/out/ /usr/share/nginx/site/
COPY --from=rag /src/apps/rag-web/out/ /usr/share/nginx/rag/
ARG GIT_COMMIT=unknown
ARG SOURCE_URL=https://github.com/LucasRangelSSouza/lucas-rangel-portfolio
ENV GIT_COMMIT=${GIT_COMMIT}
LABEL org.opencontainers.image.source=${SOURCE_URL} \
      org.opencontainers.image.revision=${GIT_COMMIT} \
      org.opencontainers.image.description="portfolio-web: static site, RAG UI and BI proxy"
# nginx-unprivileged runs as uid 101; with read_only mount tmpfs on /tmp (pid file and temp paths live there).
USER 101
# 80: site + rag by Host. 8081: bi proxy. 8080: health-only default server.
EXPOSE 80 8081 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:80/healthz || exit 1
