import { useEffect, useRef } from "react";

/**
 * A 2px gold rule across the top of the viewport that fills with page progress.
 * Writes a transform straight to the DOM (no React render per scroll frame).
 */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = document.scrollingElement ?? document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      const p = max > 0 ? el.scrollTop / max : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px]">
      <div
        ref={bar}
        className="h-full origin-left scale-x-0 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-300"
      />
    </div>
  );
}
