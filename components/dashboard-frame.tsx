"use client";

import { useEffect, useRef, useState } from "react";

type Props = { src: string | undefined; title: string; minHeight?: number };

/** Embeds a public dashboard with explicit loading, unavailable, and no-JavaScript states. */
export function DashboardFrame({ src, title, minHeight = 720 }: Props) {
  const [state, setState] = useState<"loading" | "ready" | "failed">(src ? "loading" : "failed");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!src) return;
    setState("loading");
    timer.current = setTimeout(() => setState((current) => (current === "loading" ? "failed" : current)), 40000);
    return () => clearTimeout(timer.current);
  }, [src]);

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-line bg-white" style={{ minHeight }}>
      {src ? (
        <iframe
          title={title}
          src={`${src}#bordered=false&titled=false`}
          referrerPolicy="no-referrer"
          className="block w-full border-0"
          style={{ height: "min(2600px, 230vh)", minHeight }}
          onLoad={() => {
            clearTimeout(timer.current);
            setState("ready");
          }}
        />
      ) : null}
      {state === "loading" ? (
        <div role="status" className="absolute inset-0 z-10 grid place-content-center gap-3 bg-white text-center text-sm text-muted">
          <span aria-hidden className="mx-auto size-6 animate-spin rounded-full border-[3px] border-line border-t-accent motion-reduce:animate-none" />
          Loading the dashboard…
        </div>
      ) : null}
      {state === "failed" ? (
        <div role="alert" className="absolute inset-0 z-10 grid place-content-center gap-2 bg-white p-6 text-center text-sm text-muted">
          <strong className="text-ink">{src ? "The dashboard did not load." : "This dashboard is not connected yet."}</strong>
          {src ? (
            <span>
              Reload the page or{" "}
              <a className="text-accent-ink underline underline-offset-4" href={src} target="_blank" rel="noreferrer">
                open it directly<span className="sr-only"> (opens in a new tab)</span>
              </a>
              .
            </span>
          ) : (
            <span>It appears here once the release is published and the service passes its checks.</span>
          )}
        </div>
      ) : null}
      <noscript>
        <p className="p-6 text-sm text-muted">This dashboard needs JavaScript.</p>
      </noscript>
    </div>
  );
}
