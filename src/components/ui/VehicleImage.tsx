import { type ComponentProps, useState } from "react";
import markLight from "@/assets/logo-mark-light.webp";
import { cn } from "@/lib/cn";
import { storageSrcSet } from "@/lib/image";

/**
 * Brand-styled stand-in for a vehicle without photos yet: navy gradient, the
 * logo's car-and-globe mark, a gold horizon. Never a broken-image icon.
 */
export function VehiclePlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn(
        "relative grid h-full w-full place-items-center overflow-hidden bg-[radial-gradient(120%_90%_at_70%_15%,var(--color-navy-700),var(--color-navy-950)_70%)]",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-x-[-10%] top-[62%] h-px bg-gradient-to-r from-transparent via-gold-400/70 to-transparent"
      />
      <img src={markLight} alt="" width={359} height={160} className="w-[46%] opacity-80" />
      <span className="absolute top-[68%] text-[10.5px] font-semibold tracking-[0.2em] text-white/50 uppercase">
        {label}
      </span>
    </div>
  );
}

/**
 * <img> for vehicle photos: lazy + async by default, responsive srcset for
 * Supabase Storage URLs with an explicit `sizes`, and self-healing — browsers
 * don't fall back to `src` when a srcset candidate fails, so on error we drop the
 * srcset once and retry the original object URL.
 */
export function SmartImage({
  src,
  sizes,
  className,
  alt,
  ...rest
}: Omit<ComponentProps<"img">, "src" | "srcSet"> & { src: string; sizes: string }) {
  const [useSet, setUseSet] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const srcSet = useSet ? storageSrcSet(src) : undefined;
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt ?? ""}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => {
        if (useSet && storageSrcSet(src)) {
          setUseSet(false);
          return;
        }
        setLoaded(true);
      }}
      className={cn(
        "transition-[opacity,filter] duration-700",
        loaded ? "opacity-100 blur-0" : "opacity-0 blur-sm",
        className,
      )}
      {...rest}
    />
  );
}
