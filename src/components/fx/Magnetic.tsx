import { type ReactNode, useRef } from "react";
import { useFinePointer, useReducedMotion } from "@/hooks/useMediaFlags";
import { gsap } from "@/lib/gsap";

/**
 * Pulls its child a few pixels toward the cursor. Mouse only — on touch there is
 * no hover, so the resting state must already be the finished design.
 */
export function Magnetic({
  children,
  strength = 0.35,
}: {
  children: ReactNode;
  strength?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const enabled = fine && !reduced;

  const onMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    const el = ref.current;
    if (!el || !enabled) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    gsap.to(el, { x, y, duration: 0.6, ease: "power3.out" });
  };

  const onLeave = () => {
    if (!ref.current) return;
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
  };

  return (
    <span ref={ref} className="inline-block" onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
    </span>
  );
}
