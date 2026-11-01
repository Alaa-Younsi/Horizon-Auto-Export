import { ArrowUpRight, Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { useSearchParams } from "react-router";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { Reveal } from "@/components/fx/Reveal";
import { PageHero } from "@/components/layout/PageHero";
import { WorldDots } from "@/components/ui/WorldDots";
import { useSiteSettings } from "@/hooks/usePublicData";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/LanguageProvider";
import { cuiOf, mailHref, telHref, whatsappHref } from "@/lib/contact";
import { pick } from "@/lib/localized";
import { INQUIRY_KINDS, type InquiryKind } from "@/types/db";

function InfoCard({
  icon,
  label,
  children,
  href,
  external,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  href?: string;
  external?: boolean;
}) {
  const body = (
    <>
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-navy-900 text-gold-300 transition-colors duration-300 group-hover:bg-gold-500 group-hover:text-white">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="eyebrow block text-[10.5px] text-gold-700">{label}</span>
        <span className="mt-1 block font-semibold break-words text-navy-900">{children}</span>
      </span>
      {href && (
        <ArrowUpRight
          className="size-4 shrink-0 text-navy-900/30 transition-colors group-hover:text-gold-500"
          aria-hidden
        />
      )}
    </>
  );
  const cls =
    "group flex items-center gap-4 rounded-xl bg-white p-5 ring-1 ring-navy-900/8 transition-shadow duration-500 hover:shadow-[0_24px_50px_-34px_rgb(4_14_36/0.6)]";
  return href ? (
    <a
      href={href}
      className={cls}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default function Contact() {
  const { t, lang } = useI18n();
  const { data: s } = useSiteSettings();
  const [params] = useSearchParams();
  const kindParam = params.get("kind");
  const defaultKind: InquiryKind = (INQUIRY_KINDS as readonly string[]).includes(kindParam ?? "")
    ? (kindParam as InquiryKind)
    : "general";
  useSeo({ title: t("meta.contact.title"), description: t("meta.contact.desc") });

  return (
    <>
      <PageHero
        eyebrow={t("contact.eyebrow")}
        title={t("contact.title")}
        lead={t("contact.lead")}
      />
      <section className="relative overflow-hidden bg-paper py-16 lg:py-24">
        <WorldDots className="absolute -start-[20%] bottom-0 w-[80%] text-navy-900/[0.04]" />
        <div className="container-x relative grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {s && (
            <Reveal stagger={0.08} className="space-y-4">
              <InfoCard
                icon={<Phone className="size-5" aria-hidden />}
                label={t("contact.phone")}
                href={telHref(s.phone_e164)}
              >
                <span dir="ltr">{s.phone_display}</span>
              </InfoCard>
              <InfoCard
                icon={<Mail className="size-5" aria-hidden />}
                label={t("contact.email")}
                href={mailHref(s.email)}
              >
                {s.email}
              </InfoCard>
              {s.whatsapp_e164 && (
                <InfoCard
                  icon={<MessageCircle className="size-5" aria-hidden />}
                  label="WhatsApp"
                  href={whatsappHref(s.whatsapp_e164)}
                  external
                >
                  {t("contact.whatsapp")}
                </InfoCard>
              )}
              <InfoCard
                icon={<MapPin className="size-5" aria-hidden />}
                label={t("contact.address")}
                href={s.map_url ?? undefined}
                external
              >
                {pick(s.address, lang)}
              </InfoCard>
              <InfoCard icon={<Clock3 className="size-5" aria-hidden />} label={t("contact.hours")}>
                {pick(s.hours, lang)}
              </InfoCard>
              {s.vat_id && (
                <p className="px-2 pt-2 text-sm text-muted">
                  {s.company_name} · {t("footer.vat")}: {s.vat_id}
                  {cuiOf(s.vat_id) && ` · ${t("footer.cui")}: ${cuiOf(s.vat_id)}`}
                </p>
              )}
            </Reveal>
          )}
          <Reveal className="rounded-2xl bg-white p-6 shadow-[0_40px_80px_-50px_rgb(4_14_36/0.5)] ring-1 ring-navy-900/6 sm:p-10">
            <h2 className="font-display text-2xl font-bold text-navy-900">
              {t("contact.formTitle")}
            </h2>
            <span aria-hidden className="mt-3 mb-8 block h-[3px] w-12 bg-gold-500" />
            <InquiryForm defaultKind={defaultKind} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
