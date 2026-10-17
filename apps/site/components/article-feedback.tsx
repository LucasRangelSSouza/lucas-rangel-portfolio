"use client";

import { MessageSquare, ThumbsDown, ThumbsUp } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type CommentItem = { id: number; name: string; body: string; created_at: number };
type Feedback = { likes: number; dislikes: number; my_vote: number; comments: CommentItem[] };

const ENDPOINT = process.env.NEXT_PUBLIC_FEEDBACK_URL || "/api/feedback";

function store(key: string, value?: string) {
  try {
    if (value === undefined) return window.localStorage.getItem(key);
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode: votes and the remembered name just won't persist */
  }
  return null;
}

function voterId() {
  let id = store("feedback-voter");
  if (!id) {
    id = crypto.randomUUID();
    store("feedback-voter", id);
  }
  return id;
}

const when = (seconds: number) =>
  new Date(seconds * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function ArticleFeedback({ slug }: { slug: string }) {
  const [data, setData] = useState<Feedback | null>(null);
  const [offline, setOffline] = useState(false);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" | "sending" | "error" | "sent"; message?: string }>({ kind: "idle" });

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${ENDPOINT}/${slug}?voter=${voterId()}`);
      if (!res.ok) throw new Error(String(res.status));
      setData(await res.json());
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, [slug]);

  useEffect(() => {
    setName(store("feedback-name") ?? "");
    load();
  }, [load]);

  const vote = async (value: 1 | -1) => {
    if (!data) return;
    const next = data.my_vote === value ? 0 : value;
    try {
      const res = await fetch(`${ENDPOINT}/${slug}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voter: voterId(), value: next }),
      });
      if (res.ok) setData(await res.json());
    } catch {
      setOffline(true);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || body.trim().length < 2) {
      setStatus({ kind: "error", message: "Add your name and a comment." });
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const res = await fetch(`${ENDPOINT}/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, body, website }),
      });
      if (res.status === 429) throw new Error("Too many comments in a short time. Try again in a few minutes.");
      if (!res.ok) throw new Error("The comment could not be sent. Please try again.");
      const payload = await res.json();
      if (payload.comments) setData((d) => (d ? { ...d, comments: payload.comments } : d));
      store("feedback-name", name);
      setBody("");
      setStatus({ kind: "sent" });
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "The comment could not be sent." });
    }
  };

  if (offline && !data) {
    return <p className="mt-16 border-t border-line pt-8 text-sm text-muted">Comments are unavailable right now.</p>;
  }

  const voteButton = (value: 1 | -1, count: number, label: string) => {
    const Icon = value === 1 ? ThumbsUp : ThumbsDown;
    const on = data?.my_vote === value;
    return (
      <button
        type="button"
        onClick={() => vote(value)}
        aria-pressed={on}
        disabled={!data}
        className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors duration-200 ${
          on ? "border-accent bg-accent text-white" : "border-line bg-white text-ink hover:border-accent hover:text-accent"
        }`}
      >
        <Icon size={16} aria-hidden /> {count}
        <span className="sr-only">{label}</span>
      </button>
    );
  };

  return (
    <section aria-labelledby="feedback-title" className="mt-16 border-t border-line pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="feedback-title" className="text-xl font-bold tracking-[-0.02em]">
          Was this useful?
        </h2>
        <div className="flex gap-2">
          {voteButton(1, data?.likes ?? 0, "likes, mark as useful")}
          {voteButton(-1, data?.dislikes ?? 0, "dislikes, mark as not useful")}
        </div>
      </div>

      <h3 className="mt-10 inline-flex items-center gap-2 text-[17px] font-bold">
        <MessageSquare size={18} aria-hidden /> Comments {data ? `(${data.comments.length})` : ""}
      </h3>

      <form onSubmit={submit} className="mt-5 grid gap-3 rounded-[16px] border border-line bg-white p-5">
        <label className="grid gap-1.5 text-sm font-medium">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            required
            className="h-11 rounded-[12px] border border-line px-3 text-[15px] font-normal outline-none transition-colors focus:border-accent"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Comment
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            required
            rows={4}
            className="rounded-[12px] border border-line px-3 py-2.5 text-[15px] font-normal leading-relaxed outline-none transition-colors focus:border-accent"
          />
        </label>
        <label aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
          Website
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={status.kind === "sending"}
            className="inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-ink disabled:opacity-60"
          >
            {status.kind === "sending" ? "Sending..." : "Post comment"}
          </button>
          <p role="status" className={`text-sm ${status.kind === "error" ? "text-red-600" : "text-muted"}`}>
            {status.kind === "error" ? status.message : status.kind === "sent" ? "Thanks, your comment is up." : "Comments are public."}
          </p>
        </div>
      </form>

      <ul className="mt-6 grid gap-4">
        {data?.comments.map((c) => (
          <li key={c.id} className="rounded-[16px] border border-line bg-white p-5">
            <p className="text-sm">
              <strong className="font-semibold">{c.name}</strong>
              <span className="ml-2 font-mono text-[12px] text-muted">{when(c.created_at)}</span>
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-relaxed">{c.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
