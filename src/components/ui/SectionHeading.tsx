import type { ReactNode } from "react";
import { RevealText } from "@/components/fx/RevealText";
import { cn } from "@/lib/cn";

/** Gold eyebrow with a short rule, a masked-reveal heading, an optional lead. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  tone = "dark",
  align = "start",
  className,
  as = "h2",
  id,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  tone?: "dark" | "light";
  align?: "start" | "center";
  className?: string;
  as?: "h1" | "h2";
  id?: string;
}) {
  return (
    <div className={cn(align === "center" && "mx-auto text-center", "max-w-3xl", className)}>
      {eyebrow && (
        <p
          className={cn(
            "eyebrow mb-4 inline-flex items-center gap-3",
            // gold-700: small bold text, readable on white AND the grey "paper" sections
            tone === "dark" ? "text-gold-700" : "text-gold-300",
          )}
        >
          <span aria-hidden className="h-px w-8 bg-current" />
          {eyebrow}
        </p>
      )}
      <RevealText
        as={as}
        id={id}
        trigger={as === "h1" ? "mount" : "scroll"}
        className={cn(
          "font-display text-[clamp(1.9rem,4.2vw,3.25rem)] leading-[1.06] font-bold text-balance",
          tone === "dark" ? "text-navy-900" : "text-white",
        )}
      >
        {title}
      </RevealText>
      {lead && (
        <p
          className={cn(
            "mt-5 text-[17px] leading-relaxed text-pretty",
            tone === "dark" ? "text-muted" : "text-white/70",
          )}
        >
          {lead}
        </p>
      )}
    </div>
  );
}
