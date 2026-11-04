import { createElement, type ElementType, type ReactNode, useRef } from "react";
import { useGsap } from "@/hooks/useGsap";
import { useReducedMotion } from "@/hooks/useMediaFlags";
import { useI18n } from "@/i18n/LanguageProvider";
import { gsap, SplitText } from "@/lib/gsap";

interface RevealTextProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** "mount" for above-the-fold headings, "scroll" for everything else. */
  trigger?: "mount" | "scroll";
  delay?: number;
  id?: string;
  /** false = plain text, no split (e.g. the hero headline on phones, where it is LCP-critical). */
  animate?: boolean;
}

/**
 * Masked line-by-line word reveal (GSAP SplitText). The text stays real text for
 * screen readers and search engines (on headings SplitText sets aria-label on
 * the parent; elsewhere the split words are read as they are).
 * Words, not characters: Romanian diacritics and French ligatures stay intact.
 */
export function RevealText({
  as = "h2",
  children,
  className,
  trigger = "scroll",
  delay = 0,
  id,
  animate = true,
}: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { lang } = useI18n();

  useGsap(
    () => {
      const el = ref.current;
      if (!el || reduced || !animate) return;
      const split = SplitText.create(el, {
        type: "lines,words",
        mask: "lines",
        autoSplit: true,
        linesClass: "reveal-line",
        // aria-label is only allowed on headings (and roles), not on a <p>/<span>:
        // there the words stay plain inline text, which reads the same.
        aria: typeof as === "string" && /^h[1-6]$/.test(as) ? "auto" : "none",
        onSplit(self) {
          return gsap.from(self.words, {
            yPercent: 115,
            rotate: 4,
            duration: 1.1,
            ease: "expo.out",
            stagger: 0.045,
            delay,
            scrollTrigger:
              trigger === "scroll" ? { trigger: el, start: "top 88%", once: true } : undefined,
          });
        },
      });
      return () => split.revert();
    },
    ref,
    [reduced, lang, trigger, delay, as, animate],
  );

  // key={lang}: SplitText.revert() restores the HTML it snapshotted at split time.
  // Without a fresh element per language, switching RO -> EN would put the
  // Romanian heading back over React's English render.
  return createElement(as, { ref, className, id, key: lang }, children);
}
