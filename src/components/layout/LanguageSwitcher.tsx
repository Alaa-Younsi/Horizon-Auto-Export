import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { Flag } from "@/components/ui/Flag";
import { useI18n } from "@/i18n/LanguageProvider";
import { LANG_META, SITE_LANGS } from "@/i18n/languages";
import { cn } from "@/lib/cn";

/** Flag + code button with a small menu. Closes on outside click, Escape and choice. */
export function LanguageSwitcher({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`${t("nav.language")}: ${LANG_META[lang].native}`}
        className={cn(
          "flex h-10 items-center gap-2 rounded-md px-2.5 text-[13px] font-bold tracking-wider transition-colors",
          tone === "dark" ? "text-navy-900 hover:bg-navy-50" : "text-white hover:bg-white/10",
        )}
      >
        <Flag code={LANG_META[lang].flag} className="h-3.5 w-5" />
        {LANG_META[lang].short}
        <ChevronDown
          className={cn("size-3.5 transition-transform duration-300", open && "rotate-180")}
          aria-hidden
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            id={menuId}
            initial={{ y: -6, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -6, scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute end-0 top-full z-50 mt-2 w-44 origin-top-right overflow-hidden rounded-lg bg-white p-1.5 shadow-[0_24px_60px_-20px_rgb(4_14_36/0.45)] ring-1 ring-navy-900/8"
          >
            {SITE_LANGS.map((l) => (
              <li key={l}>
                <button
                  type="button"
                  lang={l}
                  onClick={() => {
                    setOpen(false);
                    setLang(l);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-start text-sm font-medium transition-colors",
                    l === lang ? "bg-navy-50 text-navy-900" : "text-navy-800 hover:bg-gold-50",
                  )}
                >
                  <Flag code={LANG_META[l].flag} className="h-3.5 w-5" />
                  <span className="flex-1">{LANG_META[l].native}</span>
                  {l === lang && <Check className="size-4 text-gold-600" aria-hidden />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
