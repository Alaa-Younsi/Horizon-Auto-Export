import { type ReactNode, useRef } from "react";
import { useGsap } from "@/hooks/useGsap";
import { useReducedMotion } from "@/hooks/useMediaFlags";
import { cn } from "@/lib/cn";
import { gsap } from "@/lib/gsap";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Animate direct children one after another instead of the block as a whole. */
  stagger?: number;
  y?: number;
  delay?: number;
  as?: "div" | "section" | "ul" | "ol" | "article";
}

/**
 * Scroll-triggered rise-in. Runs once. Under reduced motion it renders static.
 * Elements already on screen at mount animate immediately (ScrollTrigger fires
 * on its first refresh), so nothing above the fold waits on a scroll.
 * Transform only, never opacity: if the tween ever stalls (dropped frames, a
 * trigger that never fires) the worst case is "slightly offset", not "invisible"
 * (dz-cod-store, animation safety).
 */
export function Reveal({
  children,
  className,
  stagger,
  y = 48,
  delay = 0,
  as = "div",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGsap(
    () => {
      const el = ref.current;
      if (!el || reduced) return;
      const targets = stagger ? Array.from(el.children) : el;
      gsap.from(targets, {
        y,
        duration: 1.2,
        delay,
        stagger: stagger ?? 0,
        ease: "expo.out",
        clearProps: "transform",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });
    },
    ref,
    [reduced, stagger, y, delay],
  );

  const Tag = as;
  return (
    <Tag ref={ref as React.RefObject<never>} className={cn(className)}>
      {children}
    </Tag>
  );
}
