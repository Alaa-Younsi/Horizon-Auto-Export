import { Search, SlidersHorizontal, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { Select } from "@/components/ui/Field";
import { useI18n } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/cn";
import {
  activeFilterCount,
  EMPTY_FILTERS,
  type VehicleFilters as Filters,
  parseYear,
  SORTS,
} from "@/lib/vehicles";
import { type BrandRow, FUELS, PUBLIC_CATEGORIES, TRANSMISSIONS } from "@/types/db";

/**
 * A model-year box. Typing "20" on the way to "2018" must not filter (or be
 * wiped by the URL round-trip), so the text is local and only a complete year
 * (or an empty box) is committed.
 */
function YearInput({
  value,
  onCommit,
  label,
}: {
  value: number | null;
  onCommit: (year: number | null) => void;
  label: string;
}) {
  const [text, setText] = useState(value ? String(value) : "");
  useEffect(() => setText(value ? String(value) : ""), [value]);
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={4}
      value={text}
      placeholder={label}
      aria-label={label}
      onChange={(e) => {
        const next = e.target.value.replace(/[^0-9]/g, "");
        setText(next);
        if (next === "") onCommit(null);
        else if (next.length === 4 && parseYear(next)) onCommit(Number(next));
      }}
      className="h-12 w-full min-w-0 rounded-md border border-line bg-white px-3.5 text-[15px] text-navy-900 tabular-nums placeholder:text-muted/80 focus:border-navy-900 focus:outline-none"
    />
  );
}

export function VehicleFilters({
  value,
  onChange,
  brands,
}: {
  value: Filters;
  onChange: (next: Filters) => void;
  brands: BrandRow[];
}) {
  const { t } = useI18n();
  const uid = useId();
  const [open, setOpen] = useState(false);
  const set = <K extends keyof Filters>(key: K, v: Filters[K]) => onChange({ ...value, [key]: v });
  const count = activeFilterCount(value);
  const categories = [null, ...PUBLIC_CATEGORIES] as const;

  return (
    <div className="rounded-xl bg-white p-3 shadow-[0_20px_50px_-36px_rgb(4_14_36/0.6)] ring-1 ring-navy-900/8 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div
          role="tablist"
          aria-label={t("veh.filter.category")}
          className="flex shrink-0 gap-1 overflow-x-auto rounded-lg bg-navy-50 p-1 scrollbar-none"
        >
          {categories.map((c) => {
            const selected = value.category === c;
            return (
              <button
                key={c ?? "all"}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => set("category", c)}
                className={cn(
                  "relative h-10 shrink-0 rounded-md px-4 text-[13.5px] font-semibold transition-colors duration-300",
                  selected ? "text-white" : "text-navy-900/70 hover:text-navy-900",
                )}
              >
                {selected && (
                  <motion.span
                    layoutId={`${uid}-cat-pill`}
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                    className="absolute inset-0 rounded-md bg-navy-900"
                  />
                )}
                <span className="relative">{c ? t(`cat.${c}`) : t("veh.filter.all")}</span>
              </button>
            );
          })}
        </div>

        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={value.q}
            onChange={(e) => set("q", e.target.value)}
            placeholder={t("veh.filter.search")}
            aria-label={t("veh.filter.search")}
            className="h-12 w-full rounded-md border border-line bg-white ps-10 pe-4 text-[15px] text-navy-900 placeholder:text-muted/70 focus:border-navy-900 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={`${uid}-more`}
          className="flex h-12 items-center justify-center gap-2 rounded-md border border-line px-4 text-sm font-semibold text-navy-900 lg:hidden"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          {t("veh.filter.open")}
          {count > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-gold-500 text-[11px] text-white">
              {count}
            </span>
          )}
        </button>
      </div>

      <div
        id={`${uid}-more`}
        className={cn(
          "mt-3 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.3fr)_minmax(0,1fr)_auto]",
          open ? "grid" : "hidden",
        )}
      >
        <Select
          aria-label={t("veh.filter.brand")}
          value={value.brand ?? ""}
          onChange={(e) => set("brand", e.target.value || null)}
        >
          <option value="">{t("veh.filter.anyBrand")}</option>
          {[...brands]
            .sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }))
            .map((b) => (
              <option key={b.id} value={b.slug}>
                {b.name}
              </option>
            ))}
        </Select>
        <Select
          aria-label={t("veh.filter.fuel")}
          value={value.fuel ?? ""}
          onChange={(e) => set("fuel", (e.target.value || null) as Filters["fuel"])}
        >
          <option value="">{t("veh.filter.anyFuel")}</option>
          {FUELS.map((f) => (
            <option key={f} value={f}>
              {t(`fuel.${f}`)}
            </option>
          ))}
        </Select>
        <Select
          aria-label={t("veh.filter.transmission")}
          value={value.transmission ?? ""}
          onChange={(e) => set("transmission", (e.target.value || null) as Filters["transmission"])}
        >
          <option value="">{t("veh.filter.anyTransmission")}</option>
          {TRANSMISSIONS.map((tr) => (
            <option key={tr} value={tr}>
              {t(`trans.${tr}`)}
            </option>
          ))}
        </Select>
        <fieldset className="flex min-w-0 items-center gap-2">
          <legend className="sr-only">{t("veh.filter.year")}</legend>
          <YearInput
            value={value.yearMin}
            label={t("veh.filter.yearMin")}
            onCommit={(y) => set("yearMin", y)}
          />
          <span aria-hidden className="text-muted">
            –
          </span>
          <YearInput
            value={value.yearMax}
            label={t("veh.filter.yearMax")}
            onCommit={(y) => set("yearMax", y)}
          />
        </fieldset>
        <Select
          aria-label={t("veh.filter.sort")}
          value={value.sort}
          onChange={(e) => set("sort", e.target.value as Filters["sort"])}
        >
          {SORTS.map((s) => (
            <option key={s} value={s}>
              {t(`veh.sort.${s}`)}
            </option>
          ))}
        </Select>
        <div className="flex items-center justify-between gap-4 sm:col-span-2 lg:col-span-1">
          <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-medium whitespace-nowrap text-navy-900">
            <input
              type="checkbox"
              checked={value.sold}
              onChange={(e) => set("sold", e.target.checked)}
              className="size-4 accent-navy-900"
            />
            {t("veh.filter.showSold")}
          </label>
          {count > 0 && (
            <button
              type="button"
              onClick={() => onChange({ ...EMPTY_FILTERS, sort: value.sort })}
              className="flex items-center gap-1.5 text-[13.5px] font-semibold whitespace-nowrap text-gold-700 hover:text-gold-600"
            >
              <X className="size-3.5" aria-hidden />
              {t("veh.filter.reset")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
