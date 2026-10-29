import { type DependencyList, type RefObject, useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";

/**
 * Runs GSAP code inside a gsap.context scoped to `scope`, reverting every tween,
 * ScrollTrigger and SplitText it created on unmount or when deps change — so
 * route changes never leave a stale pin or a split heading behind.
 */
export function useGsap(
  setup: (ctx: gsap.Context) => unknown,
  scope: RefObject<HTMLElement | null>,
  deps: DependencyList = [],
): void {
  const effect = () => {
    if (!scope.current) return;
    let cleanup: unknown;
    const ctx = gsap.context((self) => {
      cleanup = setup(self);
    }, scope.current);
    return () => {
      if (typeof cleanup === "function") cleanup();
      ctx.revert();
    };
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are forwarded from the caller on purpose (same contract as useEffect)
  useLayoutEffect(effect, deps);
}
