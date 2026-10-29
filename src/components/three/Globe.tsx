import {
  Component,
  lazy,
  type MutableRefObject,
  type ReactNode,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { isConstrainedDevice, supportsWebGL, useReducedMotion } from "@/hooks/useMediaFlags";
import { cn } from "@/lib/cn";
import { GlobePoster } from "./GlobePoster";

const GlobeScene = lazy(() =>
  import("./globe/GlobeScene").then((m) => ({ default: m.GlobeScene })),
);

class WebGLBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * The export globe. Performance budget (animated-site-starter rules):
 *  - three.js lives in its own chunk, fetched only when the globe nears the viewport;
 *  - the render loop stops whenever the globe is off-screen;
 *  - data-saver / 2G / very weak devices / no WebGL get the static SVG poster;
 *  - reduced motion: the globe renders still, with every lane already drawn.
 */
export function Globe({
  className,
  label,
  origin,
  progress,
}: {
  className?: string;
  label: string;
  origin: string;
  progress: MutableRefObject<number>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [capable] = useState(() => supportsWebGL() && !isConstrainedDevice());

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setNear(true);
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Reduced motion: no story, every lane drawn from the start.
  useEffect(() => {
    if (reduced) progress.current = 1;
  }, [reduced, progress]);

  const poster = <GlobePoster className="h-full w-full" label={label} />;

  return (
    <div ref={ref} className={cn("relative", className)}>
      {capable && near ? (
        <WebGLBoundary fallback={poster}>
          <Suspense fallback={poster}>
            <GlobeScene
              active={visible}
              animate={!reduced}
              progress={progress}
              label={label}
              origin={origin}
              className="relative h-full w-full cursor-grab touch-pan-y active:cursor-grabbing"
            />
          </Suspense>
        </WebGLBoundary>
      ) : (
        poster
      )}
    </div>
  );
}
