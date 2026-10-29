import { useEffect } from "react";
import { useLenis } from "@/components/fx/SmoothScroll";

/**
 * Locks page scroll while an overlay is open. Uses `position: fixed` at the
 * current offset — `overflow: hidden` alone doesn't stop iOS Safari rubber-banding,
 * which drifts fixed overlays away from their real tap targets.
 */
export function useScrollLock(locked: boolean): void {
  const lenis = useLenis();
  useEffect(() => {
    if (!locked) return;
    const { body } = document;
    const y = window.scrollY;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    lenis?.stop();
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, y);
      lenis?.start();
    };
  }, [locked, lenis]);
}
