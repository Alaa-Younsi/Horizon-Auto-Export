import { useRef } from "react";

/**
 * Milliseconds since the form mounted, sent with every public submission. The
 * server rejects anything under 2.5 s (scripted bots submit instantly) — this
 * is the browser half of a check whose real enforcement lives in the RPC.
 */
export function useFormTimer() {
  const mountedAt = useRef(Date.now());
  return {
    elapsed: () => Date.now() - mountedAt.current,
    reset: () => {
      mountedAt.current = Date.now();
    },
  };
}
