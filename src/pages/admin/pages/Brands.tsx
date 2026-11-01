import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { BrandMark } from "@/components/ui/BrandMark";
import { Input } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { slugify } from "@/lib/format";
import { requireSupabase } from "@/lib/supabase";
import type { BrandRow } from "@/types/db";
import { adminErrorKey } from "../adminErrors";
import { invalidateBrands, useAdminBrands } from "../data";
import { useAdminT } from "../i18n/AdminI18n";
import { ImageUpload } from "../ui/ImageUpload";
import {
  adminButton,
  Badge,
  ConfirmDialog,
  EmptyState,
  FormField,
  LoadError,
  Modal,
  PageHeader,
  Panel,
  Spinner,
  Toggle,
} from "../ui/kit";
import { useToast } from "../ui/Toast";

type BrandForm = Pick<BrandRow, "name" | "slug" | "logo_url" | "active" | "show_on_home"> & {
  sort_order: string;
};

/** Explicit mapper: the form never carries id/created_at/updated_at into a write. */
function toForm(b: BrandRow | null, nextOrder: number): BrandForm {
  return {
    name: b?.name ?? "",
    slug: b?.slug ?? "",
    logo_url: b?.logo_url ?? null,
    active: b?.active ?? true,
    show_on_home: b?.show_on_home ?? true,
    sort_order: String(b?.sort_order ?? nextOrder),
  };
}

function BrandEditor({
  brand,
  nextOrder,
  onClose,
}: {
  brand: BrandRow | null;
  nextOrder: number;
  onClose: () => void;
}) {
  const { t } = useAdminT();
  const qc = useQueryClient();
  const toast = useToast();
  const [f, setF] = useState<BrandForm>(() => toForm(brand, nextOrder));
  const [busy, setBusy] = useState(false);
  const slug = f.slug || slugify(f.name);
  const invalid = f.name.trim().length === 0 || slug.length === 0;

  const save = async () => {
    setBusy(true);
    const payload = {
      name: f.name.trim(),
      slug,
      logo_url: f.logo_url,
      active: f.active,
      show_on_home: f.show_on_home,
      sort_order: Number.parseInt(f.sort_order, 10) || 0,
    };
    const db = requireSupabase();
    const { error } = brand
      ? await db.from("brands").update(payload).eq("id", brand.id)
      : await db.from("brands").insert(payload);
    setBusy(false);
    if (error) {
      toast.error(t(adminErrorKey(error)));
      return;
    }
    invalidateBrands(qc);
    toast.success(t("saved"));
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      busy={busy}
      title={brand ? t("brand.edit") : t("brand.add")}
      footer={
        <>
          <button type="button" className={adminButton.secondary} onClick={onClose} disabled={busy}>
            {t("cancel")}
          </button>
          <button
            type="button"
            className={adminButton.gold}
            onClick={() => void save()}
            disabled={busy || invalid}
          >
            {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            {t("save")}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField id="b-name" label={t("brand.name")} required>
          <Input
            id="b-name"
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
          />
        </FormField>
        <FormField id="b-slug" label={t("brand.slug")}>
          <Input
            id="b-slug"
            value={f.slug}
            placeholder={slugify(f.name)}
            onChange={(e) => setF({ ...f, slug: slugify(e.target.value) })}
          />
        </FormField>
        <ImageUpload
          label={t("brand.logo")}
          hint={t("brand.logoHint")}
          value={f.logo_url}
          onChange={(url) => setF({ ...f, logo_url: url })}
          folder="brands"
        />
        <div className="flex h-12 items-center gap-3 rounded-xl bg-paper px-4 text-navy-900">
          <span className="text-xs font-semibold text-muted">{t("preview")}</span>
          <span className="h-7">
            <BrandMark brand={{ slug, name: f.name || "—", logo_url: f.logo_url }} />
          </span>
        </div>
        <FormField id="b-sort" label={t("brand.sort")}>
          <Input
            id="b-sort"
            inputMode="numeric"
            value={f.sort_order}
            onChange={(e) => setF({ ...f, sort_order: e.target.value })}
          />
        </FormField>
        <div className="flex flex-col gap-3">
          <Toggle
            checked={f.active}
            onChange={(v) => setF({ ...f, active: v })}
            label={t("brand.active")}
          />
          <Toggle
            checked={f.show_on_home}
            onChange={(v) => setF({ ...f, show_on_home: v })}
            label={t("brand.onHome")}
          />
        </div>
      </div>
    </Modal>
  );
}

export default function Brands() {
  const { t } = useAdminT();
  const q = useAdminBrands();
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<BrandRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<BrandRow | null>(null);
  const [busy, setBusy] = useState(false);
  const rows = q.data ?? [];
  const nextOrder = rows.reduce((m, b) => Math.max(m, b.sort_order), 0) + 10;

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    const { error } = await requireSupabase().from("brands").delete().eq("id", deleting.id);
    setBusy(false);
    if (error) {
      toast.error(t(adminErrorKey(error, "deleteError")));
      return;
    }
    invalidateBrands(qc);
    setDeleting(null);
  };

  return (
    <>
      <PageHeader
        title={t("brand.title")}
        description={t("brand.desc")}
        actions={
          <button type="button" className={adminButton.gold} onClick={() => setEditing("new")}>
            <Plus className="size-4" aria-hidden />
            {t("brand.add")}
          </button>
        }
      />
      <Panel>
        {q.isPending ? (
          <Spinner />
        ) : q.isError ? (
          <LoadError />
        ) : rows.length === 0 ? (
          <EmptyState text={t("brand.empty")} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((b) => (
              <li
                key={b.id}
                className={cn(
                  "flex items-center gap-4 rounded-xl p-4 ring-1 ring-line",
                  !b.active && "opacity-60",
                )}
              >
                <span className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden text-[10px] text-navy-900">
                  <span className="h-8">
                    <BrandMark brand={b} />
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-navy-900">{b.name}</span>
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    {!b.active && <Badge>{t("team.inactive")}</Badge>}
                    {b.active && b.show_on_home && <Badge tone="gold">{t("nav.home")}</Badge>}
                  </span>
                </span>
                <button
                  type="button"
                  className={adminButton.icon}
                  onClick={() => setEditing(b)}
                  aria-label={t("edit")}
                >
                  <Pencil className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  className={adminButton.icon}
                  onClick={() => setDeleting(b)}
                  aria-label={t("delete")}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {editing && (
        <BrandEditor
          key={editing === "new" ? "new" : editing.id}
          brand={editing === "new" ? null : editing}
          nextOrder={nextOrder}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => void remove()}
        messageKey="brand.deleteConfirm"
        busy={busy}
      />
    </>
  );
}
