import { ArrowRight, ArrowUp, Mail, MapPin, Phone, ReceiptText } from "lucide-react";
import { forwardRef } from "react";
import { Link } from "react-router";
import logoFullLight from "@/assets/logo-full-light.webp";
import { useLenis } from "@/components/fx/SmoothScroll";
import { ButtonLink } from "@/components/ui/Button";
import { WorldDots } from "@/components/ui/WorldDots";
import { useSiteSettings } from "@/hooks/usePublicData";
import { useI18n } from "@/i18n/LanguageProvider";
import { BRAND_NAME } from "@/lib/brand";
import { mailHref, telHref } from "@/lib/contact";
import { pick } from "@/lib/localized";
import { NAV_ITEMS } from "./navigation";

/**
 * Navy footer. PublicLayout pins it under the page (curtain reveal) when it fits
 * the viewport, so the forwarded ref is what gets measured.
 */
export const Footer = forwardRef<HTMLElement>(function Footer(_props, ref) {
  const { t, path, lang } = useI18n();
  const { data: s } = useSiteSettings();
  const lenis = useLenis();
  const year = new Date().getFullYear();
  const companyName = s?.company_name ?? BRAND_NAME;

  const toTop = () => {
    if (lenis) lenis.scrollTo(0, { duration: 1.6 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer ref={ref} className="grain relative overflow-hidden bg-navy-900 text-white">
      <WorldDots className="absolute -end-[8%] -top-[4%] w-[78%] text-white/[0.07]" />
      <div className="container-x relative pt-16 pb-8 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr_1fr_1.2fr] lg:gap-10">
          <div>
            <img
              src={logoFullLight}
              alt={BRAND_NAME}
              width={384}
              height={300}
              loading="lazy"
              className="h-28 w-auto"
            />
          </div>

          <div>
            <p className="eyebrow mb-5 text-gold-300">{t("footer.explore")}</p>
            <ul className="space-y-2.5 text-[15px]">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <Link
                    to={path(item.to)}
                    className="group inline-flex items-center gap-2 text-white/75 transition-colors hover:text-white"
                  >
                    <span className="h-px w-0 bg-gold-400 transition-[width] duration-300 group-hover:w-3" />
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {s && (
            <div>
              <p className="eyebrow mb-5 text-gold-300">{t("footer.contact")}</p>
              <ul className="space-y-3 text-[15px] text-white/75">
                <li>
                  <a
                    href={telHref(s.phone_e164)}
                    className="flex items-center gap-3 hover:text-white"
                  >
                    <Phone className="size-4 text-gold-400" aria-hidden />
                    <span dir="ltr">{s.phone_display}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={mailHref(s.email)}
                    className="flex items-center gap-3 break-all hover:text-white"
                  >
                    <Mail className="size-4 shrink-0 text-gold-400" aria-hidden />
                    {s.email}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="size-4 text-gold-400" aria-hidden />
                  {pick(s.address, lang)}
                </li>
                {s.vat_id && (
                  <li className="flex items-center gap-3">
                    <ReceiptText className="size-4 text-gold-400" aria-hidden />
                    {t("footer.vat")}: {s.vat_id}
                  </li>
                )}
                {s.trade_register && (
                  <li className="ps-7">
                    {t("footer.reg")}: {s.trade_register}
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="lg:border-s lg:border-white/10 lg:ps-10">
            <p className="font-display text-xl leading-snug font-semibold text-gold-300">
              {t("cta.tagline")}
            </p>
            <ButtonLink to={path("/contact")} className="mt-7" size="lg">
              {t("cta.button")}
              <ArrowRight
                className="size-4 transition-transform group-hover/btn:translate-x-1"
                aria-hidden
              />
            </ButtonLink>
          </div>
        </div>

        <p
          aria-hidden
          className="font-wide pointer-events-none mt-16 text-center text-[clamp(3rem,13vw,11rem)] leading-none font-black tracking-tight text-transparent select-none [-webkit-text-stroke:1px_rgb(213_182_127/0.28)]"
        >
          HORIZON
        </p>

        <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 text-[13px] text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {companyName}
            {companyName.endsWith(".") ? "" : "."} {t("footer.rights")}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to={path("/terms")} className="hover:text-white">
              {t("footer.terms")}
            </Link>
            <Link to={path("/privacy")} className="hover:text-white">
              {t("footer.privacy")}
            </Link>
            <button
              type="button"
              onClick={toTop}
              className="inline-flex items-center gap-1.5 text-gold-300 hover:text-gold-200"
            >
              <ArrowUp className="size-3.5" aria-hidden />
              {t("footer.backTop")}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
});
