import { AboutTeaser } from "@/components/sections/home/AboutTeaser";
import { BrandsMarquee } from "@/components/sections/home/BrandsMarquee";
import { FeaturedVehicles } from "@/components/sections/home/FeaturedVehicles";
import { Hero } from "@/components/sections/home/Hero";
import { ServicesStrip } from "@/components/sections/home/ServicesStrip";
import { WhyUs } from "@/components/sections/home/WhyUs";
import { useSeo } from "@/hooks/useSeo";
import { useI18n } from "@/i18n/LanguageProvider";

/** The mock-up's structure, top to bottom, with the export story and stock added. */
export default function Home() {
  const { t } = useI18n();
  useSeo({ title: t("meta.home.title"), description: t("meta.home.desc") });
  return (
    <>
      <Hero />
      <ServicesStrip />
      <AboutTeaser />
      <WhyUs />
      <FeaturedVehicles />
      <BrandsMarquee />
    </>
  );
}
