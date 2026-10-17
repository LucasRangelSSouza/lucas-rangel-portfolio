"""Embedding provider selection and the lexical-only default."""
import pytest

from rag_chat_backend.embed import OpenAICompatEmbedder, make_embedder
from rag_chat_backend.pg_store import PgStore


def test_default_provider_is_none(monkeypatch):
    monkeypatch.delenv("EMBED_PROVIDER", raising=False)
    assert make_embedder() is None
    assert make_embedder("none") is None and make_embedder("") is None


def test_openai_compat_and_qwen_alias(monkeypatch):
    monkeypatch.setenv("EMBED_BASE_URL", "http://gpu.invalid/v1")
    assert isinstance(make_embedder("openai_compat"), OpenAICompatEmbedder)
    assert isinstance(make_embedder("qwen"), OpenAICompatEmbedder)


def test_vertex_was_removed_and_unknown_providers_fail_loudly():
    with pytest.raises(ValueError, match="removed"):
        make_embedder("vertex")
    with pytest.raises(ValueError, match="unknown"):
        make_embedder("whatever")


def test_pg_store_without_embedder_is_lexical_only():
    store = PgStore("postgresql://u:p@127.0.0.1:1/none")  # no connection is made at construction
    assert store.vector_available is False and store.embed("merenda escolar") is None


def test_pg_store_embed_degrades_to_none_on_failures():
    class Down:
        def embed(self, text, kind="query"):
            raise RuntimeError("gpu off")

    class Wrong:
        def embed(self, text, kind="query"):
            return [0.1] * 12

    class Fine:
        def embed(self, text, kind="query"):
            return [0.1] * 768

    dsn = "postgresql://u:p@127.0.0.1:1/none"
    assert PgStore(dsn, embedder=Down()).embed("x") is None
    assert PgStore(dsn, embedder=Wrong()).embed("x") is None
    store = PgStore(dsn, embedder=Fine())
    assert store.vector_available is True and len(store.embed("x")) == 768
