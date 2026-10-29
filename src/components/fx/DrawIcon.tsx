import type { LucideIcon } from "lucide-react";
import { useRef } from "react";
import { useGsap } from "@/hooks/useGsap";
import { useReducedMotion } from "@/hooks/useMediaFlags";
import { gsap } from "@/lib/gsap";

/**
 * A Lucide icon whose strokes draw themselves in when scrolled into view. Each
 * path is normalised with pathLength=1 so one dash value fits every shape. The
 * icon is fully drawn at rest under reduced motion (and if JS never runs).
 */
export function DrawIcon({
  icon: Icon,
  className,
  delay = 0,
}: {
  icon: LucideIcon;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useGsap(
    () => {
      const el = ref.current;
      if (!el || reduced) return;
      const shapes = el.querySelectorAll<SVGGeometryElement>("path, circle, rect, line, polyline");
      for (const s of shapes) s.setAttribute("pathLength", "1");
      gsap.fromTo(
        shapes,
        { strokeDasharray: 1, strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          duration: 1.6,
          delay,
          ease: "power2.inOut",
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
          onComplete: () => {
            for (const s of shapes) s.style.strokeDasharray = "none";
          },
        },
      );
    },
    ref,
    [reduced, delay],
  );

  return (
    <span ref={ref} className="inline-flex">
      <Icon className={className} strokeWidth={1.5} aria-hidden />
    </span>
  );
}
