"use client";

import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const shown = { opacity: 1, y: 0 };

/**
 * Fades a below-the-fold block in once. The server markup starts hidden, so the
 * layout adds a <noscript> rule that forces `.reveal` visible without JavaScript.
 * With reduced motion the block appears at once, whether or not it is in view.
 */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const motionProps = reduce
    ? { animate: shown, transition: { duration: 0 } }
    : {
        whileInView: shown,
        viewport: { once: true, margin: "0px 0px -80px 0px" },
        transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div className={`reveal ${className ?? ""}`} initial={{ opacity: 0, y: 12 }} {...motionProps}>
        {children}
      </m.div>
    </LazyMotion>
  );
}
