import Lenis from "lenis";
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { useReducedMotion } from "@/hooks/useMediaFlags";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const LenisContext = createContext<Lenis | null>(null);

/** The active Lenis instance (null under reduced motion — use native scrolling then). */
export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

/**
 * Smooth scroll for the public site, driven by GSAP's ticker so ScrollTrigger and
 * Lenis share one clock (no double rAF, no jitter on pinned sections).
 * Also owns "scroll to top / to #hash on navigation".
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (reduced) return;
    const instance = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 1 });
    const onScroll = () => ScrollTrigger.update();
    instance.on("scroll", onScroll);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setLenis(instance);
    return () => {
      gsap.ticker.remove(tick);
      instance.off("scroll", onScroll);
      instance.destroy();
      setLenis(null);
    };
  }, [reduced]);

  return (
    <LenisContext.Provider value={lenis}>
      <RouteScroll lenis={lenis} />
      {children}
    </LenisContext.Provider>
  );
}

function RouteScroll({ lenis }: { lenis: Lenis | null }) {
  const { pathname, hash } = useLocation();
  const lastPath = useRef(pathname);

  useEffect(() => {
    const samePage = lastPath.current === pathname;
    lastPath.current = pathname;
    // Let the new route paint (and its sections measure) before scrolling.
    const id = window.setTimeout(() => {
      const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
      if (target) {
        if (lenis) lenis.scrollTo(target, { offset: -96, immediate: !samePage });
        else target.scrollIntoView({ behavior: samePage ? "smooth" : "auto" });
      } else if (!samePage) {
        if (lenis) lenis.scrollTo(0, { immediate: true });
        else window.scrollTo(0, 0);
      }
      ScrollTrigger.refresh();
    }, 60);
    return () => window.clearTimeout(id);
  }, [pathname, hash, lenis]);

  return null;
}
