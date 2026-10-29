import { type ReactNode, useRef } from "react";
import { useFinePointer, useReducedMotion } from "@/hooks/useMediaFlags";
import { cn } from "@/lib/cn";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  max?: number;
}

/**
 * Pointer-driven 3D tilt + a soft spotlight that follows the cursor. Writes CSS
 * custom properties only (no React re-render per mousemove). Mouse only.
 */
export function TiltCard({ children, className, max = 8 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const enabled = fine && !reduced;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !enabled) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - py) * max}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * max}deg`);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    // h-full: lets a card fill its grid/flex cell, so cards in a row match heights.
    <div className="h-full [perspective:1000px]">
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className={cn(
          "group/tilt relative [transform-style:preserve-3d] transition-transform duration-500 ease-[var(--ease-out-expo)]",
          "[transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]",
          className,
        )}
      >
        {children}
        {enabled && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/tilt:opacity-100 [background:radial-gradient(420px_circle_at_var(--mx,50%)_var(--my,50%),rgb(255_255_255/0.22),transparent_45%)]"
          />
        )}
      </div>
    </div>
  );
}
