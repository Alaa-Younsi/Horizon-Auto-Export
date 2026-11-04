import { ArrowRight, ArrowUp } from "lucide-react";
import { type ReactNode, useRef } from "react";
import { Link } from "react-router";
import logoFullLight from "@/assets/logo-full-light.webp";
import { RevealText } from "@/components/fx/RevealText";
import { useLenis } from "@/components/fx/SmoothScroll";
import { ButtonLink } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { useGsap } from "@/hooks/useGsap";
import { useReducedMotion } from "@/hooks/useMediaFlags";
import { useSiteSettings } from "@/hooks/usePublicData";
import { useI18n } from "@/i18n/LanguageProvider";
import { BRAND_NAME } from "@/lib/brand";
import { cuiOf, mailHref, telHref, whatsappHref } from "@/lib/contact";
import { gsap } from "@/lib/gsap";
import { pick } from "@/lib/localized";
import { NAV_ITEMS } from "./navigation";

/** One contact fact: a small gold label over the value, a gold rule that fills on hover. */
function ContactTile({
  label,
  href,
  children,
}: {
  label: string;
  href?: string;
  children: ReactNode;
}) {
  const body = (
    <>
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gold-400 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
      />
      <span className="block text-[11px] font-semibold tracking-[0.22em] text-gold-300/80 uppercase">
        {label}
      </span>
      <span className="mt-2.5 block text-[16px] leading-snug break-words text-white/90 transition-colors group-hover:text-white">
        {children}
      </span>
    </>
  );
  const className = "group relative block border-t border-white/12 pt-5";
  return href ? (
    <a href={href} className={className}>
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}

/**
 * The page ends on the brand's own image: a horizon. The tagline and every
 * way to reach the company sit above a gold horizon line; as the footer
 * scrolls in, a sun rises out of it (scrubbed, transform only). Below the
 * line: logo, menu, the way back up and the legal line.
 */
export function Footer() {
  const { t, path, lang } = useI18n();
  const { data: s } = useSiteSettings();
  const lenis = useLenis();
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const year = new Date().getFullYear();
  const companyName = s?.company_name ?? BRAND_NAME;
  const whatsapp = whatsappHref(s?.whatsapp_e164);

  useGsap(
    () => {
      if (reduced) return;
      const scroll = {
        trigger: root.current,
        start: "top bottom",
        end: "bottom bottom",
        scrub: true,
      };
      // GSAP folds the class's -translate-y-1/2 into yPercent, so the resting
      // value (centred on the horizon line) is -50, not 0.
      gsap.fromTo(
        "[data-sun]",
        { yPercent: 10 },
        { yPercent: -50, ease: "none", scrollTrigger: scroll },
      );
    },
    root,
    [reduced],
  );

  const toTop = () => {
    if (lenis) lenis.scrollTo(0, { duration: 1.6 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer ref={root} className="grain relative overflow-hidden bg-navy-950 text-white">
      <div className="container-x relative pt-20 lg:pt-28">
        <div className="grid items-end gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="eyebrow inline-flex items-center gap-3 text-gold-300">
              <span aria-hidden className="h-px w-8 bg-current" />
              {BRAND_NAME}
            </p>
            <RevealText
              as="p"
              className="font-display mt-5 max-w-2xl text-[clamp(1.9rem,4vw,3.3rem)] leading-[1.06] font-bold text-balance"
            >
              {t("cta.tagline")}
            </RevealText>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <ButtonLink to={path("/contact")} size="lg">
              {t("cta.button")}
              <ArrowRight
                className="size-4 transition-transform group-hover/btn:translate-x-1"
                aria-hidden
              />
            </ButtonLink>
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-14 items-center gap-2.5 rounded-md px-6 text-[15px] font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/5 hover:ring-gold-400"
              >
                <WhatsAppIcon className="size-4 text-[#25D366]" />
                WhatsApp
              </a>
            )}
          </div>
        </div>

        {s && (
          <div className="mt-16 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            <ContactTile label={t("contact.phone")} href={telHref(s.phone_e164)}>
              <span dir="ltr">{s.phone_display}</span>
            </ContactTile>
            <ContactTile label={t("contact.email")} href={mailHref(s.email)}>
              {s.email}
            </ContactTile>
            <ContactTile label={t("contact.address")}>{pick(s.address, lang)}</ContactTile>
            <ContactTile label={t("contact.hours")}>{pick(s.hours, lang)}</ContactTile>
          </div>
        )}
      </div>

      {/* the horizon: a sun rises out of it as the footer scrolls in */}
      <div
        aria-hidden
        className="relative mt-10 h-[220px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_40%)] sm:h-[300px]"
      >
        <div
          data-sun
          className="absolute start-1/2 top-full size-[min(130vw,620px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(231_212_174/0.5)_0%,rgb(191_150_83/0.3)_24%,rgb(167_124_56/0.1)_46%,transparent_68%)]"
        />
        <div
          data-sun
          className="absolute start-1/2 top-full size-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-gold-200 via-gold-400 to-gold-600 shadow-[0_0_80px_rgb(213_182_127/0.45)] sm:size-48"
        />
        <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-300 to-transparent" />
      </div>
      {/* its reflection on the water */}
      <div
        aria-hidden
        className="h-14 bg-[radial-gradient(30%_100%_at_50%_0%,rgb(191_150_83/0.22),transparent_70%)]"
      />

      <div className="container-x relative pb-8">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
          <Link to={path("/")} aria-label={BRAND_NAME} className="shrink-0">
            <img
              src={logoFullLight}
              alt={BRAND_NAME}
              width={384}
              height={300}
              loading="lazy"
              className="h-20 w-auto"
            />
          </Link>
          <nav aria-label={t("footer.explore")}>
            <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[15px] font-semibold">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <Link
                    to={path(item.to)}
                    className="text-white/70 transition-colors hover:text-gold-300"
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <button
            type="button"
            onClick={toTop}
            className="group inline-flex items-center gap-3 text-[13px] font-semibold tracking-[0.16em] text-gold-300 uppercase transition-colors hover:text-gold-200"
          >
            {t("footer.backTop")}
            <span className="grid size-10 place-items-center rounded-full ring-1 ring-gold-400/40 transition-colors group-hover:bg-gold-500 group-hover:text-navy-950">
              <ArrowUp className="size-4" aria-hidden />
            </span>
          </button>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-[13px] text-white/50 lg:flex-row lg:items-center lg:justify-between">
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              © {year} {companyName}
              {companyName.endsWith(".") ? "" : "."} {t("footer.rights")}
            </span>
            {s?.vat_id && (
              <span className="text-white/70">
                {t("footer.vat")}: {s.vat_id}
              </span>
            )}
            {cuiOf(s?.vat_id) && (
              <span className="text-white/70">
                {t("footer.cui")}: {cuiOf(s?.vat_id)}
              </span>
            )}
            {s?.trade_register && (
              <span>
                {t("footer.reg")}: {s.trade_register}
              </span>
            )}
          </p>
          {/* developer credit — the same English wording in every language */}
          <p>
            Website Developed by{" "}
            <a
              href="https://alaayounsi.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white/80 underline decoration-gold-500/60 underline-offset-4 transition-colors hover:text-gold-300"
            >
              Alaa Younsi
            </a>
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to={path("/terms")} className="hover:text-white">
              {t("footer.terms")}
            </Link>
            <Link to={path("/privacy")} className="hover:text-white">
              {t("footer.privacy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
