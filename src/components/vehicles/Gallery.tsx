import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SmartImage, VehiclePlaceholder } from "@/components/ui/VehicleImage";
import { useReducedMotion } from "@/hooks/useMediaFlags";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useI18n } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/cn";
import { storageSrcSet } from "@/lib/image";

export interface GalleryImage {
  id: string;
  url: string;
  alt: string;
}

const SWIPE = 60;

/** Fullscreen viewer. Module scope (never defined inside Gallery's render). */
function Lightbox({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: GalleryImage[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  useScrollLock(true);
  const img = images[index];
  const go = useCallback(
    (d: 1 | -1) => onIndex((index + d + images.length) % images.length),
    [index, images.length, onIndex],
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go, onClose]);
  if (!img) return null;
  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={t("veh.gallery.photo", { n: index + 1, total: images.length })}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex flex-col bg-navy-950/96 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between p-4 text-white">
        <p className="text-sm text-white/70 tabular-nums">
          {index + 1} / {images.length}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="grid size-12 place-items-center rounded-full hover:bg-white/10"
          aria-label={t("veh.gallery.close")}
        >
          <X className="size-6" aria-hidden />
        </button>
      </div>
      <div className="relative flex-1">
        <img
          key={img.id}
          src={img.url}
          srcSet={storageSrcSet(img.url)}
          sizes="100vw"
          alt={img.alt}
          className="absolute inset-0 m-auto max-h-full max-w-full object-contain p-2"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={t("veh.gallery.prev")}
              className="absolute start-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronLeft className="size-6" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={t("veh.gallery.next")}
              className="absolute end-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronRight className="size-6" aria-hidden />
            </button>
          </>
        )}
      </div>
    </motion.div>,
    document.body,
  );
}

/**
 * Main photo with crossfade + swipe (drag snaps back; the crossfade IS the
 * transition), a thumbnail rail, and a fullscreen lightbox (arrow keys, Escape).
 */
export function Gallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const current = images[index];
  const go = (d: 1 | -1) => setIndex((i) => (i + d + images.length) % images.length);

  if (!current) {
    return (
      <div className="aspect-[4/3] overflow-hidden rounded-2xl">
        <VehiclePlaceholder label={t("veh.noPhoto")} />
      </div>
    );
  }

  return (
    <div>
      <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-navy-900">
        <motion.div
          className="absolute inset-0 touch-pan-y"
          drag={images.length > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          onDragEnd={(_, info) => {
            if (info.offset.x < -SWIPE) go(1);
            else if (info.offset.x > SWIPE) go(-1);
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.img
              key={current.id}
              src={current.url}
              srcSet={storageSrcSet(current.url)}
              sizes="(min-width: 1024px) 60vw, 100vw"
              alt={current.alt || title}
              width={1200}
              height={900}
              // The first photo is this page's LCP element (lowercase: React 18).
              {...{ fetchpriority: index === 0 ? "high" : "auto" }}
              draggable={false}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 h-full w-full object-cover select-none"
            />
          </AnimatePresence>
        </motion.div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute end-3 top-3 grid size-11 place-items-center rounded-full bg-navy-950/55 text-white backdrop-blur-sm transition-colors hover:bg-navy-950/80"
          aria-label={t("veh.gallery.open")}
        >
          <Expand className="size-[18px]" aria-hidden />
        </button>
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={t("veh.gallery.prev")}
              className="absolute start-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-navy-900 shadow-lg transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={t("veh.gallery.next")}
              className="absolute end-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-navy-900 shadow-lg transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
            <p className="absolute start-3 bottom-3 rounded-sm bg-navy-950/60 px-2.5 py-1 text-xs font-semibold text-white tabular-nums backdrop-blur-sm">
              {index + 1} / {images.length}
            </p>
          </>
        )}
      </div>

      {images.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {images.map((img, i) => (
            <li key={img.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={t("veh.gallery.photo", { n: i + 1, total: images.length })}
                aria-current={i === index || undefined}
                className={cn(
                  "block h-16 w-24 overflow-hidden rounded-md ring-2 transition-[box-shadow,opacity] duration-300 sm:h-20 sm:w-28",
                  i === index ? "ring-gold-500" : "opacity-75 ring-transparent hover:opacity-100",
                )}
              >
                <SmartImage
                  src={img.url}
                  sizes="112px"
                  alt=""
                  width={224}
                  height={160}
                  className="h-full w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {open && (
          <Lightbox
            images={images}
            index={index}
            onIndex={setIndex}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
