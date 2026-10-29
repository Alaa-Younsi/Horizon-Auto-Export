import { useSyncExternalStore } from "react";

function mediaStore(query: string) {
  return {
    subscribe(onChange: () => void) {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    get: () => window.matchMedia(query).matches,
  };
}

const reduced = mediaStore("(prefers-reduced-motion: reduce)");
const desktop = mediaStore("(min-width: 1024px)");
const finePointer = mediaStore("(hover: hover) and (pointer: fine)");

export function useReducedMotion(): boolean {
  return useSyncExternalStore(reduced.subscribe, reduced.get, () => false);
}

export function useIsDesktop(): boolean {
  return useSyncExternalStore(desktop.subscribe, desktop.get, () => true);
}

/** True on a mouse/trackpad. Hover-only effects (tilt, magnetic) stay off on touch. */
export function useFinePointer(): boolean {
  return useSyncExternalStore(finePointer.subscribe, finePointer.get, () => false);
}

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

/**
 * Data-saver, 2G, or very weak hardware: heavy WebGL gets a static poster instead.
 * Read once — these don't change during a visit.
 */
export function isConstrainedDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & {
    connection?: NetworkInformationLike;
    deviceMemory?: number;
  };
  const conn = nav.connection;
  if (conn?.saveData) return true;
  if (conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g") return true;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 2) return true;
  return (nav.hardwareConcurrency ?? 8) < 3;
}

export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
