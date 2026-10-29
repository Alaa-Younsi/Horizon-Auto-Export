import { PageHero } from "@/components/layout/PageHero";
import { LEGAL } from "@/content/legal";
import { useSiteSettings } from "@/hooks/usePublicData";
import { useSeo } from "@/hooks/useSeo";
import { interpolate } from "@/i18n/interpolate";
import { useI18n } from "@/i18n/LanguageProvider";
import { formatDate } from "@/lib/format";
import { pick } from "@/lib/localized";

export default function Legal({ doc }: { doc: "privacy" | "terms" }) {
  const { t, lang } = useI18n();
  const { data: s } = useSiteSettings();
  const content = LEGAL[lang][doc];
  const vars = {
    company: s?.company_name ?? "Horizon Auto Export S.R.L.",
    vat: s?.vat_id ?? "—",
    email: s?.email ?? "—",
    address: pick(s?.address, lang, "—"),
  };
  useSeo({ title: content.title, description: interpolate(content.intro, vars).slice(0, 155) });

  return (
    <>
      <PageHero
        eyebrow={content.title}
        title={content.title}
        lead={interpolate(content.intro, vars)}
      />
      <section className="py-16 lg:py-24">
        <div className="container-x">
          <article className="mx-auto max-w-3xl">
            <p className="text-sm text-muted">
              {t("legal.updated")}: {formatDate(content.updated, lang)}
            </p>
            {content.sections.map((section) => (
              <section key={section.heading} className="mt-10">
                <h2 className="font-display text-xl font-bold text-navy-900">{section.heading}</h2>
                {section.body.map((p) => (
                  <p key={p.slice(0, 40)} className="mt-4 leading-relaxed text-muted">
                    {interpolate(p, vars)}
                  </p>
                ))}
              </section>
            ))}
          </article>
        </div>
      </section>
    </>
  );
}
