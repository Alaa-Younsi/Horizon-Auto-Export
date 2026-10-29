import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { RevealText } from "@/components/fx/RevealText";
import { WorldDots } from "@/components/ui/WorldDots";
import { useI18n } from "@/i18n/LanguageProvider";

/**
 * Inner-page header: navy, the dotted world with a pulsing Bucharest pin, a gold
 * horizon line drawn under the title (the hero's motif, quieter), breadcrumb.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  crumb,
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  /** Current page label for the breadcrumb (omit on pages one level deep). */
  crumb?: { to: string; label: string };
  children?: ReactNode;
}) {
  const { t, path } = useI18n();
  return (
    <section className="grain relative overflow-hidden bg-navy-950 text-white">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(70%_120%_at_85%_0%,rgb(36_68_125/0.7),transparent_65%)]"
      />
      <WorldDots
        pin
        className="absolute -end-[12%] top-1/2 w-[min(1100px,95%)] -translate-y-1/2 text-white/[0.09]"
      />
      <div className="container-x relative pt-16 pb-16 lg:pt-24 lg:pb-20">
        <nav
          aria-label="Breadcrumb"
          className="rise mb-8 text-[13px] text-white/55 [--rise-delay:0.1s]"
        >
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to={path("/")} className="hover:text-white">
                {t("nav.home")}
              </Link>
            </li>
            {crumb && (
              <>
                <ChevronRight className="size-3.5" aria-hidden />
                <li>
                  <Link to={crumb.to} className="hover:text-white">
                    {crumb.label}
                  </Link>
                </li>
              </>
            )}
            <ChevronRight className="size-3.5" aria-hidden />
            <li aria-current="page" className="text-gold-300">
              {eyebrow}
            </li>
          </ol>
        </nav>
        <p className="rise eyebrow flex items-center gap-3 text-gold-300 [--rise-delay:0.15s]">
          <span aria-hidden className="h-px w-8 bg-gold-400" />
          {eyebrow}
        </p>
        <RevealText
          as="h1"
          trigger="mount"
          delay={0.2}
          className="font-display mt-4 max-w-4xl text-[clamp(2.2rem,5.5vw,4.4rem)] leading-[1.02] font-extrabold tracking-tight text-balance"
        >
          {title}
        </RevealText>
        <span
          aria-hidden
          className="mt-8 block h-[2px] w-full max-w-md origin-left bg-gradient-to-r from-gold-400 to-transparent [animation:draw-line_1.4s_var(--ease-in-out-circ)_0.5s_both]"
        />
        {lead && (
          <p className="rise mt-6 max-w-2xl text-[17px] leading-relaxed text-white/75 [--rise-delay:0.6s]">
            {lead}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
