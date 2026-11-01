import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  LoaderCircle,
  Save,
  X,
} from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Input, Select } from "@/components/ui/Field";
import { OPTION_GROUPS, sortOptions } from "@/data/vehicle-options";
import { cn } from "@/lib/cn";
import { formatPrice, slugify } from "@/lib/format";
import { deleteUploadedImage, uploadImage } from "@/lib/image";
import { cleanLocalized, pick } from "@/lib/localized";
import { requireSupabase } from "@/lib/supabase";
import { netFromGross, VAT_PERCENT } from "@/lib/vat";
import {
  BODY_TYPES,
  type BodyType,
  CURRENCIES,
  type Currency,
  DRIVETRAINS,
  type Drivetrain,
  FUELS,
  type Fuel,
  type Localized,
  TRANSMISSIONS,
  type Transmission,
  VEHICLE_CATEGORIES,
  VEHICLE_STATUSES,
  type VehicleCategory,
  type VehicleImageRow,
  type VehiclePrivateRow,
  type VehicleRow,
  type VehicleStatus,
  type VehicleWithMedia,
} from "@/types/db";
import { adminErrorKey } from "../adminErrors";
import {
  ADMIN_VEHICLE_SELECT,
  adminKeys,
  invalidateVehicles,
  normalizeAdminVehicle,
  useAdminBrands,
} from "../data";
import { useAdminT } from "../i18n/AdminI18n";
import type { AdminKey } from "../i18n/en";
import {
  adminButton,
  FormField,
  LoadError,
  LocalizedInput,
  PageHeader,
  Panel,
  Spinner,
  Toggle,
} from "../ui/kit";
import { useToast } from "../ui/Toast";

/* ---------------------------------------------------------------- form state */

/**
 * The editable columns ONLY, typed against the row. Writes are built from this
 * shape, never from a spread of the loaded row: PostgREST rejects the whole
 * UPDATE if the body names a relation (brand, images) or a generated column —
 * the "edits silently never save" bug (dz-cod-store ledger #2).
 */
type Editable = Omit<VehicleRow, "id" | "created_at" | "updated_at">;

/** Inputs hold strings; numbers are parsed on save. */
interface FormState {
  slug: string;
  title: Localized;
  description: Localized;
  equipment: Localized;
  damage_notes: Localized;
  category: VehicleCategory;
  body_type: BodyType;
  brand_id: string;
  model: string;
  year: string;
  /** "" or "1".."12" */
  registration_month: string;
  accident_free: "" | "yes" | "no";
  options: string[];
  mileage_km: string;
  fuel: Fuel | "";
  transmission: Transmission | "";
  drivetrain: Drivetrain | "";
  power_hp: string;
  engine_cc: string;
  color: string;
  doors: string;
  seats: string;
  euro_norm: string;
  location: string;
  price: string;
  currency: Currency;
  vat_deductible: boolean;
  status: VehicleStatus;
  featured: boolean;
  sort_order: string;
  // vehicle_private
  vin: string;
  purchase_price: string;
  purchase_currency: Currency;
  supplier: string;
  internal_notes: string;
}

const EMPTY: FormState = {
  slug: "",
  title: {},
  description: {},
  equipment: {},
  damage_notes: {},
  category: "passenger",
  body_type: "sedan",
  brand_id: "",
  model: "",
  year: "",
  registration_month: "",
  accident_free: "",
  options: [],
  mileage_km: "",
  fuel: "",
  transmission: "",
  drivetrain: "",
  power_hp: "",
  engine_cc: "",
  color: "",
  doors: "",
  seats: "",
  euro_norm: "",
  location: "București",
  price: "",
  currency: "EUR",
  vat_deductible: true,
  status: "draft",
  featured: false,
  sort_order: "0",
  vin: "",
  purchase_price: "",
  purchase_currency: "EUR",
  supplier: "",
  internal_notes: "",
};

/** Keys whose input is a plain text box. */
type TextKey = { [K in keyof FormState]: FormState[K] extends string ? K : never }[keyof FormState];

const str = (v: number | string | null | undefined) =>
  v === null || v === undefined ? "" : String(v);

function toFormState(row: VehicleRow, priv: VehiclePrivateRow | null): FormState {
  return {
    slug: row.slug,
    title: row.title ?? {},
    description: row.description ?? {},
    equipment: row.equipment ?? {},
    damage_notes: row.damage_notes ?? {},
    category: row.category,
    body_type: row.body_type,
    brand_id: row.brand_id ?? "",
    model: row.model ?? "",
    year: str(row.year),
    registration_month: str(row.registration_month),
    accident_free:
      row.accident_free === null || row.accident_free === undefined
        ? ""
        : row.accident_free
          ? "yes"
          : "no",
    options: row.options ?? [],
    mileage_km: str(row.mileage_km),
    fuel: row.fuel ?? "",
    transmission: row.transmission ?? "",
    drivetrain: row.drivetrain ?? "",
    power_hp: str(row.power_hp),
    engine_cc: str(row.engine_cc),
    color: row.color ?? "",
    doors: str(row.doors),
    seats: str(row.seats),
    euro_norm: row.euro_norm ?? "",
    location: row.location ?? "",
    price: str(row.price),
    currency: row.currency,
    vat_deductible: row.vat_deductible,
    status: row.status,
    featured: row.featured,
    sort_order: str(row.sort_order),
    vin: priv?.vin ?? "",
    purchase_price: str(priv?.purchase_price),
    purchase_currency: priv?.purchase_currency ?? "EUR",
    supplier: priv?.supplier ?? "",
    internal_notes: priv?.internal_notes ?? "",
  };
}

const int = (s: string) => {
  const n = Number.parseInt(s.replace(/[\s.]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};
const money = (s: string) => {
  const n = Number(s.replace(/\s/g, "").replace(",", "."));
  return s.trim() !== "" && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};
const text = (s: string) => s.trim() || null;

/** A title is optional: brand + model (+ year) stands in for it on the site. */
function effectiveTitle(f: FormState, brandName: string | undefined): Localized {
  const own = cleanLocalized(f.title);
  if (Object.keys(own).length) return own;
  const fallback = [brandName, f.model.trim()].filter(Boolean).join(" ");
  return fallback ? { ro: fallback } : {};
}

function toPayload(f: FormState, brandName: string | undefined): Omit<Editable, "slug"> {
  return {
    title: effectiveTitle(f, brandName),
    description: cleanLocalized(f.description),
    // the checklist replaces the old free text: saving clears it
    equipment: {},
    damage_notes: f.category === "damaged" ? cleanLocalized(f.damage_notes) : {},
    category: f.category,
    body_type: f.body_type,
    brand_id: f.brand_id || null,
    model: text(f.model),
    year: int(f.year),
    registration_month: f.year.trim() ? int(f.registration_month) : null,
    accident_free: f.accident_free === "" ? null : f.accident_free === "yes",
    options: sortOptions(f.options),
    mileage_km: int(f.mileage_km),
    fuel: f.fuel || null,
    transmission: f.transmission || null,
    drivetrain: f.drivetrain || null,
    power_hp: int(f.power_hp),
    engine_cc: int(f.engine_cc),
    color: text(f.color),
    doors: int(f.doors),
    seats: int(f.seats),
    euro_norm: text(f.euro_norm),
    location: text(f.location),
    price: money(f.price),
    currency: f.currency,
    vat_deductible: f.vat_deductible,
    status: f.status,
    featured: f.featured,
    sort_order: int(f.sort_order) ?? 0,
  };
}

/**
 * Slugs are unique: an empty slugify() (or a duplicate title) must not surface
 * as a generic "save failed". Probe and suffix -2, -3… until free.
 */
async function uniqueSlug(base: string, selfId: string | null): Promise<string> {
  const db = requireSupabase();
  const root = slugify(base) || "vehicul";
  for (let i = 1; i < 50; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    const { data, error } = await db
      .from("vehicles")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (error) throw error;
    if (!data || data.id === selfId) return candidate;
  }
  return `${root}-${crypto.randomUUID().slice(0, 6)}`;
}

/* ---------------------------------------------------------------- photos */

function Photos({ vehicleId, images }: { vehicleId: string; images: VehicleWithMedia["images"] }) {
  const { t } = useAdminT();
  const qc = useQueryClient();
  const toast = useToast();
  const inputId = useId();
  const [list, setList] = useState(images);
  const [uploading, setUploading] = useState(0);
  const [busy, setBusy] = useState(false);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    const picked = Array.from(files).slice(0, 30);
    setUploading(picked.length);
    const db = requireSupabase();
    let order = list.reduce((m, i) => Math.max(m, i.sort_order), -1) + 1;
    for (const file of picked) {
      try {
        const url = await uploadImage(file, `vehicles/${vehicleId}`);
        const { data, error } = await db
          .from("vehicle_images")
          .insert({ vehicle_id: vehicleId, url, sort_order: order })
          .select("id, url, alt, sort_order")
          .single();
        if (error) {
          void deleteUploadedImage(url);
          throw error;
        }
        order += 1;
        setList((l) => [...l, data]);
      } catch {
        toast.error(t("uploadError"));
      } finally {
        setUploading((n) => Math.max(0, n - 1));
      }
    }
    invalidateVehicles(qc);
  };

  /** Order is load-bearing: index 0 is the cover. Persist every index; revert on failure. */
  const move = async (from: number, to: number) => {
    if (to < 0 || to >= list.length) return;
    const before = list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    const renumbered = next.map((img, i) => ({ ...img, sort_order: i }));
    setList(renumbered);
    setBusy(true);
    const db = requireSupabase();
    const results = await Promise.all(
      renumbered.map((img) =>
        db.from("vehicle_images").update({ sort_order: img.sort_order }).eq("id", img.id),
      ),
    );
    setBusy(false);
    if (results.some((r) => r.error)) {
      setList(before);
      toast.error(t("saveError"));
      return;
    }
    invalidateVehicles(qc);
  };

  const remove = async (img: (typeof list)[number]) => {
    setBusy(true);
    const { error } = await requireSupabase().from("vehicle_images").delete().eq("id", img.id);
    setBusy(false);
    if (error) {
      toast.error(t(adminErrorKey(error, "deleteError")));
      return;
    }
    void deleteUploadedImage(img.url);
    setList((l) => l.filter((x) => x.id !== img.id));
    invalidateVehicles(qc);
  };

  return (
    <div>
      <p className="mb-4 text-sm text-muted">{t("veh.photos.hint")}</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((img, i) => (
          <li
            key={img.id}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-paper ring-1 ring-line"
          >
            <img src={img.url} alt="" className="h-full w-full object-cover" loading="lazy" />
            {i === 0 && (
              <span className="absolute start-2 top-2 rounded-md bg-gold-500 px-2 py-0.5 text-[11px] font-bold text-white">
                {t("veh.photos.cover")}
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-navy-950/80 to-transparent p-2">
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={busy || i === 0}
                  onClick={() => void move(i, i - 1)}
                  className="grid size-8 place-items-center rounded-full bg-white/90 text-navy-900 disabled:opacity-30"
                  aria-label={t("veh.photos.left")}
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  disabled={busy || i === list.length - 1}
                  onClick={() => void move(i, i + 1)}
                  className="grid size-8 place-items-center rounded-full bg-white/90 text-navy-900 disabled:opacity-30"
                  aria-label={t("veh.photos.right")}
                >
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove(img)}
                className="grid size-8 place-items-center rounded-full bg-white/90 text-navy-900 disabled:opacity-30"
                aria-label={t("veh.photos.remove")}
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </li>
        ))}
        <li>
          <label
            htmlFor={inputId}
            className="grid aspect-[4/3] cursor-pointer place-items-center rounded-xl border-2 border-dashed border-line text-center text-sm font-semibold text-navy-900 hover:border-gold-400 hover:bg-gold-50"
          >
            <span className="flex flex-col items-center gap-2 px-3">
              {uploading ? (
                <>
                  <LoaderCircle className="size-6 animate-spin text-gold-500" aria-hidden />
                  {t("veh.photos.uploadingN", { n: uploading })}
                </>
              ) : (
                <>
                  <ImagePlus className="size-6 text-gold-500" aria-hidden />
                  {t("veh.photos.add")}
                </>
              )}
            </span>
          </label>
          <input
            id={inputId}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/avif"
            className="sr-only"
            disabled={uploading > 0}
            onChange={(e) => {
              void add(e.target.files);
              e.target.value = "";
            }}
          />
        </li>
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------- form */

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** The options as a checklist, grouped like the catalogue (Confort, Multimédia…). */
function OptionsChecklist({
  value,
  legacy,
  onChange,
}: {
  value: string[];
  legacy: string;
  onChange: (v: string[]) => void;
}) {
  const { t, lang } = useAdminT();
  const picked = new Set(value);
  const toggle = (key: string) => {
    const next = new Set(picked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange([...next]);
  };
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">{t("veh.options.hint", { n: picked.size })}</p>
      {legacy.trim() && (
        <p className="rounded-xl bg-gold-50 p-3 text-xs text-navy-900 ring-1 ring-gold-200">
          {t("veh.options.legacy")} <span className="font-semibold">{legacy}</span>
        </p>
      )}
      {OPTION_GROUPS.map((g) => (
        <fieldset key={g.id}>
          <legend className="mb-2 text-xs font-bold tracking-[0.14em] text-gold-700 uppercase">
            {g.label[lang]}
          </legend>
          <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
            {g.options.map((o) => {
              const on = picked.has(o.key);
              return (
                <label
                  key={o.key}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm ring-1 transition-colors",
                    on
                      ? "bg-navy-900/[0.04] font-medium text-navy-900 ring-navy-900/40"
                      : "text-navy-900/80 ring-line hover:bg-paper",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(o.key)}
                    className="size-4 shrink-0 accent-gold-500"
                  />
                  {o.label[lang]}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <Panel title={title}>{children}</Panel>;
}

function Editor({
  id,
  initial,
  images,
}: {
  id: string | null;
  initial: FormState;
  images: VehicleWithMedia["images"];
}) {
  const { t, lang } = useAdminT();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const brands = useAdminBrands();
  const [f, setF] = useState<FormState>(initial);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setF((s) => ({ ...s, [key]: value }));

  const brandName = brands.data?.find((b) => b.id === f.brand_id)?.name;
  const title = effectiveTitle(f, brandName);
  const blocked = Object.keys(title).length === 0;
  const priceN = money(f.price);
  const buyN = money(f.purchase_price);
  const margin =
    priceN !== null && buyN !== null && f.currency === f.purchase_currency ? priceN - buyN : null;

  const save = async () => {
    if (blocked) return;
    setBusy(true);
    try {
      const db = requireSupabase();
      const baseSlug = f.slug.trim() || [pick(title, "ro"), f.year].filter(Boolean).join(" ");
      const slug = await uniqueSlug(baseSlug, id);
      const payload = { ...toPayload(f, brandName), slug };
      let vehicleId = id;
      if (id) {
        const { error } = await db.from("vehicles").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await db.from("vehicles").insert(payload).select("id").single();
        if (error) throw error;
        vehicleId = data.id;
      }
      if (!vehicleId) throw new Error("ERR_NOT_FOUND");
      const { error: privError } = await db.from("vehicle_private").upsert(
        {
          vehicle_id: vehicleId,
          vin: text(f.vin)?.toUpperCase() ?? null,
          purchase_price: money(f.purchase_price),
          purchase_currency: f.purchase_currency,
          supplier: text(f.supplier),
          internal_notes: text(f.internal_notes),
        },
        { onConflict: "vehicle_id" },
      );
      if (privError) throw privError;
      invalidateVehicles(qc);
      toast.success(t("saved"));
      if (!id) navigate(`/admin/vehicles/${vehicleId}`, { replace: true });
      else setF((s) => ({ ...s, slug }));
    } catch (error) {
      // Stay on the form with the admin's input intact — never navigate away from a failed save.
      toast.error(t(adminErrorKey(error)));
    } finally {
      setBusy(false);
    }
  };

  const num = (key: TextKey, label: AdminKey, extra?: { hint?: string }) => (
    <FormField id={`v-${key}`} label={t(label)} hint={extra?.hint}>
      <Input
        id={`v-${key}`}
        inputMode="numeric"
        value={f[key]}
        onChange={(e) => {
          const value = e.target.value;
          setF((s) => ({ ...s, [key]: value }));
        }}
      />
    </FormField>
  );

  return (
    <>
      <PageHeader
        title={id ? t("veh.edit") : t("veh.new")}
        description={pick(title, lang) || undefined}
        actions={
          <>
            <Link to="/admin/vehicles" className={adminButton.secondary}>
              <ArrowLeft className="size-4" aria-hidden />
              {t("veh.back")}
            </Link>
            <button
              type="button"
              className={adminButton.gold}
              disabled={busy || blocked}
              onClick={() => void save()}
            >
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : (
                <Save className="size-4" aria-hidden />
              )}
              {id ? t("save") : t("veh.saveAndPhotos")}
            </button>
          </>
        }
      />
      {blocked && (
        <p className="mb-5 rounded-xl bg-gold-50 p-3 text-sm text-navy-900 ring-1 ring-gold-200">
          {t("veh.blocked.title")}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Section title={t("veh.section.basics")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="v-brand" label={t("veh.f.brand")}>
                <Select
                  id="v-brand"
                  value={f.brand_id}
                  onChange={(e) => set("brand_id", e.target.value)}
                >
                  <option value="">{t("veh.f.noBrand")}</option>
                  {(brands.data ?? []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField id="v-model" label={t("veh.f.model")}>
                <Input
                  id="v-model"
                  value={f.model}
                  onChange={(e) => set("model", e.target.value)}
                />
              </FormField>
              <FormField id="v-category" label={t("veh.f.category")}>
                <Select
                  id="v-category"
                  value={f.category}
                  onChange={(e) => set("category", e.target.value as VehicleCategory)}
                >
                  {VEHICLE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {t(`cat.${c}`)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField id="v-body" label={t("veh.f.body")}>
                <Select
                  id="v-body"
                  value={f.body_type}
                  onChange={(e) => set("body_type", e.target.value as BodyType)}
                >
                  {BODY_TYPES.map((b) => (
                    <option key={b} value={b}>
                      {t(`body.${b}`)}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
            <div className="mt-4">
              <LocalizedInput
                id="v-title"
                label={t("veh.f.title")}
                hint={t("veh.f.titleHint")}
                value={f.title}
                onChange={(v) => set("title", v)}
              />
            </div>
            <div className="mt-4">
              <FormField id="v-slug" label={t("veh.f.slug")} hint={t("veh.f.slugHint")}>
                <Input
                  id="v-slug"
                  value={f.slug}
                  placeholder={slugify([pick(title, "ro"), f.year].filter(Boolean).join(" "))}
                  onChange={(e) => set("slug", slugify(e.target.value))}
                />
              </FormField>
            </div>
          </Section>

          <Section title={t("veh.section.specs")}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField id="v-year" label={t("veh.f.firstReg")}>
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-2">
                  <Select
                    id="v-regmonth"
                    aria-label={t("veh.f.regMonth")}
                    value={f.registration_month}
                    onChange={(e) => set("registration_month", e.target.value)}
                  >
                    <option value="">MM</option>
                    {MONTHS.map((m) => (
                      <option key={m} value={String(m)}>
                        {String(m).padStart(2, "0")}
                      </option>
                    ))}
                  </Select>
                  <Input
                    id="v-year"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder={t("veh.f.regYear")}
                    value={f.year}
                    onChange={(e) => set("year", e.target.value.replace(/[^0-9]/g, ""))}
                  />
                </div>
              </FormField>
              {num("mileage_km", "veh.f.mileage")}
              <FormField id="v-fuel" label={t("veh.f.fuel")}>
                <Select
                  id="v-fuel"
                  value={f.fuel}
                  onChange={(e) => set("fuel", e.target.value as Fuel | "")}
                >
                  <option value="">—</option>
                  {FUELS.map((x) => (
                    <option key={x} value={x}>
                      {t(`fuel.${x}`)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField id="v-trans" label={t("veh.f.transmission")}>
                <Select
                  id="v-trans"
                  value={f.transmission}
                  onChange={(e) => set("transmission", e.target.value as Transmission | "")}
                >
                  <option value="">—</option>
                  {TRANSMISSIONS.map((x) => (
                    <option key={x} value={x}>
                      {t(`trans.${x}`)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField id="v-drive" label={t("veh.f.drivetrain")}>
                <Select
                  id="v-drive"
                  value={f.drivetrain}
                  onChange={(e) => set("drivetrain", e.target.value as Drivetrain | "")}
                >
                  <option value="">—</option>
                  {DRIVETRAINS.map((x) => (
                    <option key={x} value={x}>
                      {t(`drive.${x}`)}
                    </option>
                  ))}
                </Select>
              </FormField>
              {num("power_hp", "veh.f.power")}
              {num("engine_cc", "veh.f.engine")}
              {num("doors", "veh.f.doors")}
              {num("seats", "veh.f.seats")}
              <FormField id="v-color" label={t("veh.f.color")}>
                <Input
                  id="v-color"
                  value={f.color}
                  onChange={(e) => set("color", e.target.value)}
                />
              </FormField>
              <FormField id="v-euro" label={t("veh.f.euro")}>
                <Input
                  id="v-euro"
                  value={f.euro_norm}
                  placeholder="Euro 6d"
                  onChange={(e) => set("euro_norm", e.target.value)}
                />
              </FormField>
              <FormField id="v-accident" label={t("veh.f.accidentFree")}>
                <Select
                  id="v-accident"
                  value={f.accident_free}
                  onChange={(e) =>
                    set("accident_free", e.target.value as FormState["accident_free"])
                  }
                >
                  <option value="">—</option>
                  <option value="yes">{t("yes")}</option>
                  <option value="no">{t("no")}</option>
                </Select>
              </FormField>
              <FormField id="v-loc" label={t("veh.f.location")}>
                <Input
                  id="v-loc"
                  value={f.location}
                  onChange={(e) => set("location", e.target.value)}
                />
              </FormField>
            </div>
          </Section>

          <Section title={t("veh.section.text")}>
            <div className="space-y-4">
              <LocalizedInput
                id="v-desc"
                label={t("veh.f.description")}
                multiline
                value={f.description}
                onChange={(v) => set("description", v)}
              />
              {f.category === "damaged" && (
                <LocalizedInput
                  id="v-damage"
                  label={t("veh.f.damage")}
                  multiline
                  value={f.damage_notes}
                  onChange={(v) => set("damage_notes", v)}
                />
              )}
            </div>
          </Section>

          <Section title={t("veh.section.options")}>
            <OptionsChecklist
              value={f.options}
              legacy={pick(f.equipment, lang)}
              onChange={(v) => set("options", v)}
            />
          </Section>

          <Section title={t("veh.section.photos")}>
            {id ? (
              <Photos vehicleId={id} images={images} />
            ) : (
              <p className="rounded-xl bg-paper p-4 text-sm text-muted">
                {t("veh.photos.saveFirst")}
              </p>
            )}
          </Section>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Section title={t("veh.section.price")}>
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_7rem] gap-3">
                <FormField id="v-price" label={t("veh.f.price")} hint={t("veh.f.priceHint")}>
                  <Input
                    id="v-price"
                    inputMode="decimal"
                    value={f.price}
                    onChange={(e) => set("price", e.target.value)}
                  />
                </FormField>
                <FormField id="v-cur" label={t("veh.f.currency")}>
                  <Select
                    id="v-cur"
                    value={f.currency}
                    onChange={(e) => set("currency", e.target.value as Currency)}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
              <Toggle
                checked={f.vat_deductible}
                onChange={(v) => set("vat_deductible", v)}
                label={t("veh.f.vat")}
              />
              {f.vat_deductible && money(f.price) !== null && (
                <p className="-mt-2 text-xs text-muted">
                  {t("veh.f.vatNet", {
                    net: formatPrice(netFromGross(money(f.price) ?? 0), f.currency, lang),
                    rate: VAT_PERCENT,
                  })}
                </p>
              )}
              <FormField id="v-status" label={t("veh.f.status")}>
                <Select
                  id="v-status"
                  value={f.status}
                  onChange={(e) => set("status", e.target.value as VehicleStatus)}
                >
                  {VEHICLE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`status.${s}`)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <Toggle
                checked={f.featured}
                onChange={(v) => set("featured", v)}
                label={t("veh.featured")}
              />
              {num("sort_order", "veh.f.sortOrder", { hint: t("veh.f.sortHint") })}
            </div>
          </Section>

          <Section title={t("veh.section.private")}>
            <div className="space-y-4">
              <FormField id="v-vin" label={t("veh.f.vin")}>
                <Input
                  id="v-vin"
                  value={f.vin}
                  className="font-mono uppercase"
                  onChange={(e) => set("vin", e.target.value)}
                />
              </FormField>
              <div className="grid grid-cols-[1fr_7rem] gap-3">
                <FormField id="v-buy" label={t("veh.f.purchase")}>
                  <Input
                    id="v-buy"
                    inputMode="decimal"
                    value={f.purchase_price}
                    onChange={(e) => set("purchase_price", e.target.value)}
                  />
                </FormField>
                <FormField id="v-buy-cur" label={t("veh.f.currency")}>
                  <Select
                    id="v-buy-cur"
                    value={f.purchase_currency}
                    onChange={(e) => set("purchase_currency", e.target.value as Currency)}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
              {margin !== null && (
                <p className="text-sm text-muted">
                  {t("veh.f.margin")}:{" "}
                  <span
                    className={margin < 0 ? "font-bold text-gold-700" : "font-bold text-navy-900"}
                  >
                    {formatPrice(margin, f.currency, lang)}
                  </span>
                </p>
              )}
              <FormField id="v-sup" label={t("veh.f.supplier")}>
                <Input
                  id="v-sup"
                  value={f.supplier}
                  onChange={(e) => set("supplier", e.target.value)}
                />
              </FormField>
              <FormField id="v-notes" label={t("veh.f.notes")}>
                <textarea
                  id="v-notes"
                  value={f.internal_notes}
                  onChange={(e) => set("internal_notes", e.target.value)}
                  className="min-h-24 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-navy-900 focus:outline-none"
                />
              </FormField>
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}

/**
 * Loads the row (and its private data) BEFORE rendering the editor, then mounts
 * the editor keyed on the row so its state initialises from the data without an
 * effect. A failed load blocks the form — blank defaults must never be saveable
 * over a real vehicle.
 */
export default function VehicleForm() {
  const { id } = useParams();
  const q = useQuery({
    queryKey: adminKeys.vehicle(id ?? "new"),
    enabled: Boolean(id),
    queryFn: async () => {
      const db = requireSupabase();
      const [vehicle, priv] = await Promise.all([
        db
          .from("vehicles")
          .select(ADMIN_VEHICLE_SELECT)
          .eq("id", id ?? "")
          .maybeSingle()
          .overrideTypes<
            (Omit<VehicleWithMedia, "images"> & { images: VehicleImageRow[] | null }) | null,
            { merge: false }
          >(),
        db
          .from("vehicle_private")
          .select("*")
          .eq("vehicle_id", id ?? "")
          .maybeSingle(),
      ]);
      if (vehicle.error) throw vehicle.error;
      if (priv.error) throw priv.error;
      if (!vehicle.data) throw new Error("ERR_NOT_FOUND");
      return { vehicle: normalizeAdminVehicle(vehicle.data), priv: priv.data };
    },
  });

  if (!id) return <Editor key="new" id={null} initial={EMPTY} images={[]} />;
  if (q.isPending) return <Spinner />;
  if (q.isError) return <LoadError />;
  const { vehicle, priv } = q.data;
  return (
    <Editor
      key={`${vehicle.id}-${vehicle.updated_at}`}
      id={vehicle.id}
      initial={toFormState(vehicle, priv)}
      images={vehicle.images}
    />
  );
}
