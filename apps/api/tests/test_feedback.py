"""Feedback routes (comments and votes) over a temporary SQLite file."""
import json

import pytest
from fastapi.testclient import TestClient

from portfolio_api import feedback
from portfolio_api.main import create_app

VOTER = "a1b2c3d4-e5f6-4789-a012-b3c4d5e6f708"
SLUG = "b1-vertex-vs-open-source-embeddings"


@pytest.fixture()
def client(tmp_path, monkeypatch):
    articles = tmp_path / "articles.json"
    articles.write_text(json.dumps([{"slug": SLUG}, {"slug": "second-article"}]), encoding="utf-8")
    monkeypatch.setenv("FEEDBACK_DB", str(tmp_path / "feedback.db"))
    monkeypatch.setenv("FEEDBACK_ARTICLES_FILE", str(articles))
    monkeypatch.setenv("FEEDBACK_ADMIN_TOKEN", "s3cret")
    monkeypatch.delenv("FEEDBACK_SITE_ROOT", raising=False)
    feedback._writes.clear()
    with TestClient(create_app()) as c:
        yield c


def test_health_route(client):
    assert client.get("/api/feedback/health").json() == {"status": "ok", "db": "ok"}


def test_unknown_or_malformed_article_is_404(client):
    assert client.get("/api/feedback/not-an-article").status_code == 404
    assert client.get("/api/feedback/Bad_Slug").status_code == 404
    assert client.post("/api/feedback/not-an-article/vote", json={"voter": VOTER, "value": 1}).status_code == 404


def test_empty_article_summary(client):
    assert client.get(f"/api/feedback/{SLUG}").json() == {"likes": 0, "dislikes": 0, "my_vote": 0, "comments": []}


def test_vote_change_and_clear(client):
    url = f"/api/feedback/{SLUG}/vote"
    assert client.post(url, json={"voter": VOTER, "value": 1}).json()["likes"] == 1
    body = client.post(url, json={"voter": VOTER, "value": -1}).json()
    assert body["likes"] == 0 and body["dislikes"] == 1 and body["my_vote"] == -1
    assert client.get(f"/api/feedback/{SLUG}", params={"voter": VOTER}).json()["my_vote"] == -1
    cleared = client.post(url, json={"voter": VOTER, "value": 0}).json()
    assert cleared["likes"] == 0 and cleared["dislikes"] == 0 and cleared["my_vote"] == 0


def test_vote_validation(client):
    url = f"/api/feedback/{SLUG}/vote"
    assert client.post(url, json={"voter": "short", "value": 1}).status_code == 422
    assert client.post(url, json={"voter": VOTER, "value": 2}).status_code == 422
    assert client.post(url, json={"voter": "Z" * 20, "value": 1}).status_code == 422


def test_comment_roundtrip_and_delete_needs_admin_token(client):
    url = f"/api/feedback/{SLUG}/comments"
    created = client.post(url, json={"name": "  Ana   Maria ", "body": " Great read "})
    assert created.status_code == 201
    comments = created.json()["comments"]
    assert comments[0]["name"] == "Ana Maria" and comments[0]["body"] == "Great read"
    cid = comments[0]["id"]
    assert client.delete(f"/api/feedback/comments/{cid}").status_code == 403
    assert client.delete(f"/api/feedback/comments/{cid}", headers={"x-admin-token": "wrong"}).status_code == 403
    assert client.delete(f"/api/feedback/comments/{cid}", headers={"x-admin-token": "s3cret"}).json() == {"deleted": 1}
    assert client.get(f"/api/feedback/{SLUG}").json()["comments"] == []


def test_delete_is_forbidden_when_no_admin_token_is_configured(client, monkeypatch):
    monkeypatch.delenv("FEEDBACK_ADMIN_TOKEN")
    assert client.delete("/api/feedback/comments/1", headers={"x-admin-token": ""}).status_code == 403


def test_comment_abuse_controls(client):
    url = f"/api/feedback/{SLUG}/comments"
    assert client.post(url, json={"name": "Bot", "body": "buy now", "website": "http://spam"}).json() == {"ok": True}
    assert client.get(f"/api/feedback/{SLUG}").json()["comments"] == []
    assert client.post(url, json={"name": "A", "body": "see http://a.example http://b.example http://c.example"}).status_code == 422
    assert client.post(url, json={"name": "   ", "body": "hello there"}).status_code == 422
    assert client.post(url, json={"name": "A", "body": "x"}).status_code == 422


def test_comment_rate_limit_per_address(client):
    url = f"/api/feedback/{SLUG}/comments"
    headers = {"x-forwarded-for": "7.7.7.7"}
    for i in range(6):
        assert client.post(url, json={"name": "A", "body": f"comment {i}"}, headers=headers).status_code == 201
    assert client.post(url, json={"name": "A", "body": "one more"}, headers=headers).status_code == 429
    assert client.post(url, json={"name": "A", "body": "other ip"}, headers={"x-forwarded-for": "8.8.8.8"}).status_code == 201


def test_legacy_site_root_check(client, tmp_path, monkeypatch):
    root = tmp_path / "site"
    (root / "articles" / "only-on-disk").mkdir(parents=True)
    (root / "articles" / "only-on-disk" / "index.html").write_text("x")
    monkeypatch.setenv("FEEDBACK_SITE_ROOT", str(root))
    assert client.get("/api/feedback/only-on-disk").status_code == 200
    assert client.get(f"/api/feedback/{SLUG}").status_code == 404


def test_every_article_of_the_real_site_is_known(monkeypatch):
    """The slug list baked into the image comes from apps/site/content/articles.json."""
    monkeypatch.delenv("FEEDBACK_ARTICLES_FILE", raising=False)
    slugs = feedback.known_slugs()
    assert SLUG in slugs and len(slugs) >= 30
