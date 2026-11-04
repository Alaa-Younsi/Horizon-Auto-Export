import { type DependencyList, type RefObject, useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/** When the main thread is free (Safari has no requestIdleCallback: a short timeout). */
function onIdle(cb: () => void): () => void {
  const w = window as IdleWindow;
  if (w.requestIdleCallback && w.cancelIdleCallback) {
    const id = w.requestIdleCallback(cb, { timeout: 1500 });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(cb, 250);
  return () => window.clearTimeout(id);
}

/**
 * Runs GSAP code inside a gsap.context scoped to `scope`, reverting every tween,
 * ScrollTrigger and SplitText it created on unmount or when deps change — so
 * route changes never leave a stale pin or a split heading behind.
 *
 * Sections already on screen set up immediately (their entrance must not
 * flash). Everything further down waits for an idle moment: on a slow phone,
 * a dozen SplitTexts and ScrollTriggers built during the first paint were a
 * large share of the main-thread work before the page became usable.
 */
export function useGsap(
  setup: (ctx: gsap.Context) => unknown,
  scope: RefObject<HTMLElement | null>,
  deps: DependencyList = [],
): void {
  const effect = () => {
    const el = scope.current;
    if (!el) return;
    let cleanup: unknown;
    let ctx: gsap.Context | null = null;
    const run = () => {
      ctx = gsap.context((self) => {
        cleanup = setup(self);
      }, el);
    };
    const onScreen = el.getBoundingClientRect().top < window.innerHeight * 1.1;
    const cancelIdle = onScreen ? null : onIdle(run);
    if (onScreen) run();
    return () => {
      cancelIdle?.();
      if (typeof cleanup === "function") cleanup();
      ctx?.revert();
    };
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are forwarded from the caller on purpose (same contract as useEffect)
  useLayoutEffect(effect, deps);
}
