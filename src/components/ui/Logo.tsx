import { Link } from "react-router";
import logoDark from "@/assets/logo-header.webp";
import logoLight from "@/assets/logo-header-light.webp";
import { useI18n } from "@/i18n/LanguageProvider";
import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/cn";

/** The complete logo (mark, HORIZON, AUTO EXPORT and the tagline), 2x of its slot. */
export function Logo({
  tone = "dark",
  className,
}: {
  tone?: "dark" | "light";
  className?: string;
}) {
  const { path } = useI18n();
  return (
    <Link to={path("/")} className={cn("inline-flex shrink-0 items-center", className)}>
      <img
        src={tone === "dark" ? logoDark : logoLight}
        alt={BRAND_NAME}
        width={230}
        height={180}
        className="h-full w-auto"
        decoding="async"
      />
    </Link>
  );
}
