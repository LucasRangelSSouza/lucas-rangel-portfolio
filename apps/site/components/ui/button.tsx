import { cva, type VariantProps } from "class-variance-authority";
import type { AnchorHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center gap-2.5 rounded-xl border px-[18px] py-3 text-sm font-bold transition-colors duration-200",
  {
    variants: {
      variant: {
        primary: "border-ink bg-ink text-white hover:bg-[#1f2a3d]",
        outline: "border-line bg-white/60 text-ink hover:border-[#c3cedb] hover:bg-white",
      },
    },
    defaultVariants: { variant: "outline" },
  },
);

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & VariantProps<typeof buttonVariants>;

/** Anchor styled as a button: every call to action on this static site navigates. */
export function ButtonLink({ className, variant, ...props }: ButtonLinkProps) {
  return <a className={cn(buttonVariants({ variant }), className)} {...props} />;
}
