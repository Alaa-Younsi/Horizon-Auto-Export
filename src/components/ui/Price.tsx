import { useI18n } from "@/i18n/LanguageProvider";
import { formatPrice } from "@/lib/format";
import type { Currency } from "@/types/db";

/**
 * Every price on the site renders through this: one formatter, and the
 * "price on request" case (NULL price — common in B2B) handled in one place.
 */
export function Price({
  value,
  currency,
  className,
}: {
  value: number | null;
  currency: Currency;
  className?: string;
}) {
  const { t, lang } = useI18n();
  if (value === null || !Number.isFinite(value)) {
    return <span className={className}>{t("veh.priceOnRequest")}</span>;
  }
  return (
    <span className={className} dir="ltr">
      {formatPrice(value, currency, lang)}
    </span>
  );
}
