import { ArrowRight, Phone } from "lucide-react";
import { RevealText } from "@/components/fx/RevealText";
import { ButtonAnchor, ButtonLink } from "@/components/ui/Button";
import { useSiteSettings } from "@/hooks/usePublicData";
import { useI18n } from "@/i18n/LanguageProvider";
import { telHref } from "@/lib/contact";

/** Closing call to action for inner pages (the navy footer follows, so this one is light). */
export function CtaBand() {
  const { t, path } = useI18n();
  const { data: s } = useSiteSettings();
  return (
    <section className="relative overflow-hidden bg-gold-50 py-20 lg:py-24">
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-gold-300 to-transparent"
      />
      <div className="container-x relative">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white px-6 py-12 text-center shadow-[0_40px_80px_-50px_rgb(4_14_36/0.5)] ring-1 ring-gold-200 sm:px-12">
          <RevealText
            as="h2"
            className="font-display text-[clamp(1.8rem,3.6vw,2.8rem)] leading-tight font-bold text-navy-900"
          >
            {t("cta.title")}
          </RevealText>
          <p className="mx-auto mt-4 max-w-xl text-[17px] leading-relaxed text-muted">
            {t("cta.text")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink to={path("/contact")} size="lg">
              {t("cta.button")}
              <ArrowRight
                className="size-4 transition-transform group-hover/btn:translate-x-1"
                aria-hidden
              />
            </ButtonLink>
            {s?.phone_e164 && (
              <ButtonAnchor href={telHref(s.phone_e164)} size="lg" variant="outline">
                <Phone className="size-4" aria-hidden />
                <span dir="ltr">{s.phone_display}</span>
              </ButtonAnchor>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
