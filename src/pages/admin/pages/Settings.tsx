import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Save } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/Field";
import { CONTACT_FALLBACK } from "@/lib/contact";
import { cleanLocalized } from "@/lib/localized";
import { requireSupabase } from "@/lib/supabase";
import type { Localized, SiteSettingsRow } from "@/types/db";
import { adminErrorKey } from "../adminErrors";
import { invalidateSettings, useSettingsRow } from "../data";
import { useAdminT } from "../i18n/AdminI18n";
import type { AdminKey } from "../i18n/en";
import { ImageUpload } from "../ui/ImageUpload";
import {
  adminButton,
  FormField,
  LoadError,
  LocalizedInput,
  PageHeader,
  Panel,
  Spinner,
} from "../ui/kit";
import { useToast } from "../ui/Toast";

type TextField =
  | "company_name"
  | "phone_display"
  | "phone_e164"
  | "whatsapp_e164"
  | "email"
  | "vat_id"
  | "trade_register"
  | "map_url";

interface Form {
  text: Record<TextField, string>;
  address: Localized;
  hours: Localized;
  hero_image_url: string | null;
  about_image_url: string | null;
}

/** Only editable columns, by name — never the loaded row spread into a write. */
function toForm(row: SiteSettingsRow | null): Form {
  return {
    text: {
      company_name: row?.company_name ?? "",
      phone_display: row?.phone_display ?? "",
      phone_e164: row?.phone_e164 ?? "",
      whatsapp_e164: row?.whatsapp_e164 ?? "",
      email: row?.email ?? "",
      vat_id: row?.vat_id ?? "",
      trade_register: row?.trade_register ?? "",
      map_url: row?.map_url ?? "",
    },
    address: row?.address ?? {},
    hours: row?.hours ?? {},
    hero_image_url: row?.hero_image_url ?? null,
    about_image_url: row?.about_image_url ?? null,
  };
}

const E164 = /^\+[1-9][0-9]{6,14}$/;

function SettingsForm({ row }: { row: SiteSettingsRow | null }) {
  const { t } = useAdminT();
  const qc = useQueryClient();
  const toast = useToast();
  const [f, setF] = useState<Form>(() => toForm(row));
  const [busy, setBusy] = useState(false);
  const fb = CONTACT_FALLBACK;

  const e164Error = (v: string) =>
    v.trim() && !E164.test(v.trim()) ? t("set.e164Hint") : undefined;
  const invalid = Boolean(e164Error(f.text.phone_e164) || e164Error(f.text.whatsapp_e164));

  const field = (key: TextField, label: AdminKey, extra?: { hint?: string; error?: string }) => (
    <FormField id={`s-${key}`} label={t(label)} hint={extra?.hint} error={extra?.error}>
      <Input
        id={`s-${key}`}
        value={f.text[key]}
        placeholder={fb[key] ?? ""}
        onChange={(e) => setF({ ...f, text: { ...f.text, [key]: e.target.value } })}
      />
    </FormField>
  );

  const save = async () => {
    setBusy(true);
    const blank = (v: string) => v.trim() || null;
    const address = cleanLocalized(f.address);
    const hours = cleanLocalized(f.hours);
    const { error } = await requireSupabase()
      .from("site_settings")
      .update({
        company_name: blank(f.text.company_name),
        phone_display: blank(f.text.phone_display),
        phone_e164: blank(f.text.phone_e164),
        whatsapp_e164: blank(f.text.whatsapp_e164),
        email: blank(f.text.email),
        vat_id: blank(f.text.vat_id),
        trade_register: blank(f.text.trade_register),
        map_url: blank(f.text.map_url),
        address: Object.keys(address).length ? address : null,
        hours: Object.keys(hours).length ? hours : null,
        hero_image_url: f.hero_image_url,
        about_image_url: f.about_image_url,
      })
      .eq("id", true);
    setBusy(false);
    if (error) {
      toast.error(t(adminErrorKey(error)));
      return;
    }
    invalidateSettings(qc);
    toast.success(t("saved"));
  };

  return (
    <>
      <PageHeader
        title={t("set.title")}
        description={t("set.desc")}
        actions={
          <button
            type="button"
            className={adminButton.gold}
            disabled={busy || invalid}
            onClick={() => void save()}
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <Save className="size-4" aria-hidden />
            )}
            {t("save")}
          </button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={t("set.contact")}>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("phone_display", "set.phoneDisplay")}
            {field("phone_e164", "set.phoneE164", {
              hint: t("set.e164Hint"),
              error: e164Error(f.text.phone_e164),
            })}
            {field("whatsapp_e164", "set.whatsapp", { error: e164Error(f.text.whatsapp_e164) })}
            {field("email", "set.email")}
            <div className="sm:col-span-2">{field("map_url", "set.mapUrl")}</div>
          </div>
          <div className="mt-4 space-y-4">
            <LocalizedInput
              id="s-address"
              label={t("set.address")}
              value={f.address}
              placeholder={fb.address ?? undefined}
              onChange={(v) => setF({ ...f, address: v })}
            />
            <LocalizedInput
              id="s-hours"
              label={t("set.hours")}
              value={f.hours}
              placeholder={fb.hours ?? undefined}
              onChange={(v) => setF({ ...f, hours: v })}
            />
          </div>
        </Panel>
        <div className="space-y-6">
          <Panel title={t("set.company")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">{field("company_name", "set.companyName")}</div>
              {field("vat_id", "set.vat")}
              {field("trade_register", "set.reg")}
            </div>
          </Panel>
          <Panel title={t("set.images")}>
            <div className="space-y-6">
              <ImageUpload
                wide
                folder="site"
                label={t("set.hero")}
                hint={t("set.heroHint")}
                value={f.hero_image_url}
                onChange={(url) => setF({ ...f, hero_image_url: url })}
              />
              <ImageUpload
                folder="site"
                label={t("set.about")}
                value={f.about_image_url}
                onChange={(url) => setF({ ...f, about_image_url: url })}
              />
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

export default function Settings() {
  const q = useSettingsRow();
  if (q.isPending) return <Spinner />;
  if (q.isError) return <LoadError />;
  return <SettingsForm key={q.data?.updated_at ?? "none"} row={q.data} />;
}
