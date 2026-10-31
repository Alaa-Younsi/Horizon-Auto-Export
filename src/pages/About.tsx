import { Gauge, type LucideIcon, ScanEye, ShieldCheck } from "lucide-react";
import { DrawIcon } from "@/components/fx/DrawIcon";
import { Reveal } from "@/components/fx/Reveal";
import { AboutStory } from "@/components/sections/about/AboutStory";
import { WhyUs } from "@/components/sections/home/WhyUs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useSiteSettings } from "@/hooks/usePublicData";
import { useSeo } from "@/hooks/useSeo";
import type { TranslationKey } from "@/i18n/dictionaries";
import { useI18n } from "@/i18n/LanguageProvider";
import { pick } from "@/lib/localized";

const VALUES: Array<{ icon: LucideIcon; title: TranslationKey; text: TranslationKey }> = [
  { icon: ScanEye, title: "about.value1.title", text: "about.value1.text" },
  { icon: ShieldCheck, title: "about.value2.title", text: "about.value2.text" },
  { icon: Gauge, title: "about.value3.title", text: "about.value3.text" },
];

export default function About() {
  const { t, lang } = useI18n();
  const { data: s } = useSiteSettings();
  useSeo({ title: t("meta.about.title"), description: t("meta.about.desc") });

  return (
    <>
      <AboutStory />

      <section className="bg-paper py-20 lg:py-28">
        <div className="container-x">
          <SectionHeading eyebrow={t("about.mission.title")} title={t("about.values.title")} />
          <Reveal stagger={0.12} className="mt-12 grid gap-6 md:grid-cols-3">
            {VALUES.map((v, i) => (
              <article
                key={v.title}
                className="group relative overflow-hidden rounded-xl bg-white p-8 ring-1 ring-navy-900/6 transition-shadow duration-500 hover:shadow-[0_30px_60px_-40px_rgb(4_14_36/0.6)]"
              >
                <span
                  aria-hidden
                  className="font-wide absolute end-5 top-4 text-6xl font-black text-navy-900/[0.04]"
                >
                  0{i + 1}
                </span>
                <span className="grid size-14 place-items-center rounded-full bg-navy-900 text-gold-300">
                  <DrawIcon icon={v.icon} className="size-6" delay={0.2 + i * 0.12} />
                </span>
                <h3 className="font-display mt-6 text-xl font-bold text-navy-900">{t(v.title)}</h3>
                <p className="mt-3 leading-relaxed text-muted">{t(v.text)}</p>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-[0.18] bg-gold-500 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-x-100"
                />
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      <WhyUs />

      {s && (
        <section className="py-20 lg:py-24">
          <div className="container-x">
            <Reveal className="grid gap-10 rounded-2xl bg-white p-8 ring-1 ring-navy-900/8 sm:p-12 lg:grid-cols-[1fr_2fr]">
              <h2 className="font-display text-2xl font-bold text-navy-900">
                {t("about.company.title")}
              </h2>
              <dl className="grid gap-6 sm:grid-cols-2">
                {[
                  [t("about.company.name"), s.company_name],
                  [t("about.company.seat"), pick(s.address, lang)],
                  [t("footer.vat"), s.vat_id],
                  [t("footer.reg"), s.trade_register],
                  [t("contact.phone"), s.phone_display],
                  [t("contact.email"), s.email],
                ]
                  .filter((row): row is [string, string] => Boolean(row[1]))
                  .map(([label, value]) => (
                    <div key={label} className="border-s-2 border-gold-500 ps-4">
                      <dt className="eyebrow text-[10.5px] text-gold-700">{label}</dt>
                      <dd className="mt-1.5 font-semibold break-words text-navy-900">{value}</dd>
                    </div>
                  ))}
              </dl>
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}
