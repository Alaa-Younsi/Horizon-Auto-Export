import { BRAND_LOGOS } from "@/data/brand-logos";
import { cn } from "@/lib/cn";
import type { BrandRow } from "@/types/db";

type BrandLike = Pick<BrandRow, "slug" | "name" | "logo_url">;

/**
 * A make's mark in the current text colour: an uploaded logo if the admin set
 * one, else the built-in path for that slug, else a wide wordmark (e.g. CUPRA,
 * which simple-icons doesn't carry). currentColor = navy at rest, gold on hover.
 */
export function BrandMark({ brand, className }: { brand: BrandLike; className?: string }) {
  if (brand.logo_url) {
    return (
      <img
        src={brand.logo_url}
        alt={brand.name}
        loading="lazy"
        decoding="async"
        className={cn("h-full w-auto object-contain", className)}
      />
    );
  }
  const builtIn = BRAND_LOGOS[brand.slug];
  if (builtIn) {
    return (
      <svg
        viewBox="0 0 24 24"
        role="img"
        aria-label={brand.name}
        className={cn("h-full w-auto", className)}
        fill="currentColor"
      >
        <path d={builtIn.path} />
      </svg>
    );
  }
  return (
    <span
      className={cn(
        "font-wide inline-flex h-full items-center text-[1.05em] font-bold tracking-[0.18em] uppercase",
        className,
      )}
    >
      {brand.name}
    </span>
  );
}
