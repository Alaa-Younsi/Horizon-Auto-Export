import type { ComponentProps, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";
import { cn } from "@/lib/cn";

type Variant = "gold" | "navy" | "outline" | "outlineLight" | "ghost" | "light";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex select-none items-center justify-center gap-2.5 overflow-hidden rounded-md font-semibold whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform] duration-300 ease-[var(--ease-out-expo)] focus-visible:outline-2 focus-visible:outline-offset-3 disabled:pointer-events-none disabled:opacity-55 active:scale-[0.97]";

const variants: Record<Variant, string> = {
  gold: "bg-gold-500 text-white shadow-[0_14px_34px_-14px_rgb(167_124_56/0.9)] hover:bg-gold-600 hover:shadow-[0_18px_40px_-14px_rgb(167_124_56/1)]",
  navy: "bg-navy-900 text-white shadow-[0_14px_34px_-16px_rgb(8_25_61/0.8)] hover:bg-navy-800",
  outline:
    "border border-navy-900/20 text-navy-900 hover:border-navy-900/60 hover:bg-navy-900/[0.03]",
  outlineLight: "border border-white/30 text-white hover:border-white/70 hover:bg-white/[0.06]",
  ghost: "text-current hover:bg-current/8",
  light: "bg-white text-navy-900 shadow-[0_12px_30px_-14px_rgb(4_14_36/0.6)] hover:bg-gold-50",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-[15px]",
};

interface StyleProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

/** A sweep of light crosses the button on hover — the site's one button motif. */
function Shine() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 -start-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-[inset-inline-start] duration-700 ease-[var(--ease-out-expo)] group-hover/btn:start-[130%]"
    />
  );
}

export function buttonClass({
  variant = "gold",
  size = "md",
  className,
}: Omit<StyleProps, "children">) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant,
  size,
  className,
  children,
  ...props
}: StyleProps & Omit<ComponentProps<"button">, "children" | "className">) {
  return (
    <button className={buttonClass({ variant, size, className })} {...props}>
      <Shine />
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  className,
  children,
  ...props
}: StyleProps & Omit<LinkProps, "children" | "className">) {
  return (
    <Link className={buttonClass({ variant, size, className })} {...props}>
      <Shine />
      {children}
    </Link>
  );
}

export function ButtonAnchor({
  variant,
  size,
  className,
  children,
  ...props
}: StyleProps & Omit<ComponentProps<"a">, "children" | "className">) {
  return (
    <a className={buttonClass({ variant, size, className })} {...props}>
      <Shine />
      {children}
    </a>
  );
}
