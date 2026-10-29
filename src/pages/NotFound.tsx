import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { WorldDots } from "@/components/ui/WorldDots";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/LanguageProvider";

export default function NotFound() {
  const { t, path } = useI18n();
  useSeo({ title: t("meta.notFound.title"), noindex: true });
  return (
    <section className="grain relative grid min-h-[78vh] place-items-center overflow-hidden bg-navy-950 px-6 text-center text-white">
      <WorldDots
        pin
        className="absolute top-1/2 left-1/2 w-[min(1200px,140%)] -translate-x-1/2 -translate-y-1/2 text-white/[0.07]"
      />
      <div className="relative">
        <p
          aria-hidden
          className="font-wide text-[clamp(6rem,22vw,14rem)] leading-none font-black text-transparent [-webkit-text-stroke:1.5px_rgb(213_182_127/0.6)]"
        >
          404
        </p>
        <span
          aria-hidden
          className="mx-auto mt-2 block h-[2px] w-40 bg-gradient-to-r from-transparent via-gold-400 to-transparent"
        />
        <h1 className="font-display mt-8 text-3xl font-bold">{t("notFound.title")}</h1>
        <p className="mt-3 text-white/70">{t("notFound.text")}</p>
        <ButtonLink to={path("/")} className="mt-9" size="lg">
          <ArrowLeft className="size-4" aria-hidden />
          {t("notFound.home")}
        </ButtonLink>
      </div>
    </section>
  );
}
