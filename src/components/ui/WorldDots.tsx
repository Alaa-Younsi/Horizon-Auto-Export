import { cn } from "@/lib/cn";

/**
 * The dotted world map (public/images/world-dots.svg, built by
 * scripts/build-globe-points.ts) used as a CSS mask, so it takes the current
 * text colour — an <img> could only ever be the SVG's own fill. Aspect 360:132
 * (2° grid, 76°N..56°S). The optional gold pin marks Bucharest (26.1°E, 44.4°N).
 */
export function WorldDots({ className, pin = false }: { className?: string; pin?: boolean }) {
  return (
    <div aria-hidden className={cn("pointer-events-none relative aspect-[360/132]", className)}>
      <div className="absolute inset-0 bg-current [mask-image:url(/images/world-dots.svg)] [mask-size:100%_100%] [mask-repeat:no-repeat]" />
      {pin && (
        <span className="absolute top-[23.9%] left-[57.25%] grid size-3 -translate-x-1/2 -translate-y-1/2 place-items-center">
          <span className="absolute size-3 animate-pulse-ring rounded-full bg-gold-400" />
          <span className="size-2 rounded-full bg-gold-400 shadow-[0_0_12px_rgb(213_182_127)]" />
        </span>
      )}
    </div>
  );
}
