import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={cn("rounded-[20px] border border-line bg-white", className)} {...props} />;
}
