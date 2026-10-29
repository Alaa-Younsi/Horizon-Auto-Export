import { cn } from "@/lib/cn";

/** Tiny inline flags for the language switcher (no image requests, crisp at any DPR). */
export function Flag({ code, className }: { code: "ro" | "gb" | "fr"; className?: string }) {
  const cls = cn("shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10", className);
  if (code === "ro")
    return (
      <svg viewBox="0 0 3 2" className={cls} aria-hidden>
        <rect width="1" height="2" fill="#002B7F" />
        <rect x="1" width="1" height="2" fill="#FCD116" />
        <rect x="2" width="1" height="2" fill="#CE1126" />
      </svg>
    );
  if (code === "fr")
    return (
      <svg viewBox="0 0 3 2" className={cls} aria-hidden>
        <rect width="1" height="2" fill="#002654" />
        <rect x="1" width="1" height="2" fill="#fff" />
        <rect x="2" width="1" height="2" fill="#CE1126" />
      </svg>
    );
  return (
    <svg viewBox="0 0 60 40" className={cls} aria-hidden>
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0L60 40M60 0L0 40" stroke="#fff" strokeWidth="8" />
      <path d="M0 0L60 40M60 0L0 40" stroke="#C8102E" strokeWidth="3" />
      <path d="M30 0v40M0 20h60" stroke="#fff" strokeWidth="12" />
      <path d="M30 0v40M0 20h60" stroke="#C8102E" strokeWidth="7" />
    </svg>
  );
}
