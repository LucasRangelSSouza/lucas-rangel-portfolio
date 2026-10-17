"""portfolio-api entry point: `uvicorn portfolio_api.main:app`."""
from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from . import feedback
from .rag_routes import EngineHolder, corpus_health
from .rag_routes import router as rag_router


def create_app(engine_factory=None) -> FastAPI:
    app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
    app.state.rag = EngineHolder(engine_factory)
    app.include_router(rag_router)
    app.include_router(feedback.router)

    @app.get("/api/health")
    def health() -> JSONResponse:
        """Always 200 while the process serves: a down database shows up as status=degraded + db_unavailable."""
        payload = corpus_health(app.state.rag.health())
        payload["feedback"] = feedback.db_status()
        payload["commit"] = os.environ.get("GIT_COMMIT", "unknown")
        return JSONResponse(payload, headers={"cache-control": "no-store"})

    return app


app = create_app()
