# portfolio-api: one FastAPI process (RAG answer/explore/health + article feedback).
# Build from the repository root:  docker build -f docker/api.Dockerfile -t portfolio-api .
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /app
COPY apps/api/requirements.txt .
RUN pip install -r requirements.txt
COPY apps/api/rag_chat_backend ./rag_chat_backend
COPY apps/api/portfolio_api ./portfolio_api
# Slugs of the published articles: the feedback routes only accept these.
COPY apps/site/content/articles.json ./articles.json
RUN useradd --system --uid 10001 --no-create-home app && mkdir /data && chown 10001 /data
ARG GIT_COMMIT=unknown
ARG SOURCE_URL=https://github.com/LucasRangelSSouza/lucas-rangel-portfolio
ENV GIT_COMMIT=${GIT_COMMIT} PORT=8080 FEEDBACK_DB=/data/feedback.db EMBED_PROVIDER=none
LABEL org.opencontainers.image.source=${SOURCE_URL} \
      org.opencontainers.image.revision=${GIT_COMMIT} \
      org.opencontainers.image.description="portfolio-api: RAG routes and article feedback"
USER 10001
EXPOSE 8080
# /data (SQLite) is the only writable path besides /tmp; mount a volume on /data and tmpfs on /tmp with read_only.
HEALTHCHECK --interval=15s --timeout=4s --start-period=10s --retries=5 \
    CMD python -c "import urllib.request,sys;sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8080/api/health',timeout=3).status==200 else 1)"
CMD ["sh", "-c", "exec uvicorn portfolio_api.main:app --host 0.0.0.0 --port ${PORT} --no-access-log"]
