import { useQueryClient } from "@tanstack/react-query";
import { CarFront, ExternalLink, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Select } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { formatDate, formatPrice } from "@/lib/format";
import { deleteUploadedImage } from "@/lib/image";
import { requireSupabase } from "@/lib/supabase";
import { vehicleTitle } from "@/lib/vehicles";
import { VEHICLE_STATUSES, type VehicleStatus, type VehicleWithMedia } from "@/types/db";
import { adminErrorKey } from "../adminErrors";
import { invalidateVehicles, useAdminVehicles, VEHICLES_LIMIT } from "../data";
import { useAdminT } from "../i18n/AdminI18n";
import {
  adminButton,
  Badge,
  type BadgeTone,
  ConfirmDialog,
  EmptyState,
  LoadError,
  PageHeader,
  Panel,
  Spinner,
} from "../ui/kit";
import { useToast } from "../ui/Toast";

const TONE: Record<VehicleStatus, BadgeTone> = {
  draft: "gray",
  available: "navySolid",
  reserved: "goldSolid",
  sold: "navy",
};

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const { t } = useAdminT();
  return <Badge tone={TONE[status]}>{t(`status.${status}`)}</Badge>;
}

function Row({ v, onDelete }: { v: VehicleWithMedia; onDelete: (v: VehicleWithMedia) => void }) {
  const { t, lang } = useAdminT();
  const qc = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const cover = v.images[0];

  const patch = async (values: { status?: VehicleStatus; featured?: boolean }) => {
    setBusy(true);
    const { error } = await requireSupabase().from("vehicles").update(values).eq("id", v.id);
    setBusy(false);
    if (error) {
      toast.error(t(adminErrorKey(error)));
      return;
    }
    invalidateVehicles(qc);
    toast.success(t("saved"));
  };

  return (
    <li className="flex flex-wrap items-center gap-4 py-4 sm:flex-nowrap">
      <Link to={`/admin/vehicles/${v.id}`} className="flex min-w-0 flex-1 items-center gap-4">
        <span className="grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-lg bg-navy-900">
          {cover ? (
            <img src={cover.url} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <CarFront className="size-6 text-gold-300" aria-hidden />
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold text-navy-900">
            {vehicleTitle(v, lang)}
          </span>
          <span className="block truncate text-xs text-muted">
            {[v.year, t(`cat.${v.category}`), t("veh.photos", { n: v.images.length })]
              .filter(Boolean)
              .join(" · ")}
          </span>
          <span className="mt-1 block text-sm font-semibold text-navy-900 tabular-nums">
            {v.price === null ? t("veh.priceOnRequest") : formatPrice(v.price, v.currency, lang)}
          </span>
        </span>
      </Link>
      <div className="flex w-full items-center justify-end gap-1 sm:w-auto">
        <button
          type="button"
          disabled={busy}
          onClick={() => void patch({ featured: !v.featured })}
          className={cn(adminButton.icon, v.featured && "text-gold-500")}
          aria-pressed={v.featured}
          aria-label={t("veh.featured")}
          title={t("veh.featured")}
        >
          <Star className="size-4" fill={v.featured ? "currentColor" : "none"} aria-hidden />
        </button>
        <Select
          aria-label={t("veh.col.status")}
          value={v.status}
          disabled={busy}
          onChange={(e) => void patch({ status: e.target.value as VehicleStatus })}
          className="h-9 w-36 text-sm"
        >
          {VEHICLE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </Select>
        <span className="hidden w-24 text-end text-xs text-muted lg:block">
          {formatDate(v.updated_at, lang, { day: "numeric", month: "short" })}
        </span>
        {v.status !== "draft" && (
          <a
            href={`/ro/vehicles/${v.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={adminButton.icon}
            aria-label={t("veh.view")}
            title={t("veh.view")}
          >
            <ExternalLink className="size-4" aria-hidden />
          </a>
        )}
        <Link
          to={`/admin/vehicles/${v.id}`}
          className={adminButton.icon}
          aria-label={t("edit")}
          title={t("edit")}
        >
          <Pencil className="size-4" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={() => onDelete(v)}
          className={adminButton.icon}
          aria-label={t("delete")}
          title={t("delete")}
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
    </li>
  );
}

export default function Vehicles() {
  const { t, lang } = useAdminT();
  const q = useAdminVehicles();
  const qc = useQueryClient();
  const toast = useToast();
  const [status, setStatus] = useState<VehicleStatus | null>(null);
  const [term, setTerm] = useState("");
  const [deleting, setDeleting] = useState<VehicleWithMedia | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = q.data?.rows ?? [];
  const list = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return rows.filter(
      (v) =>
        (!status || v.status === status) &&
        (!needle ||
          `${vehicleTitle(v, lang)} ${v.brand?.name ?? ""} ${v.slug}`
            .toLowerCase()
            .includes(needle)),
    );
  }, [rows, status, term, lang]);

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    const { error } = await requireSupabase().from("vehicles").delete().eq("id", deleting.id);
    setBusy(false);
    if (error) {
      toast.error(t(adminErrorKey(error, "deleteError")));
      return;
    }
    // Rows cascade; the files are cleaned up best-effort (an orphan is harmless).
    for (const img of deleting.images) void deleteUploadedImage(img.url);
    invalidateVehicles(qc);
    setDeleting(null);
  };

  return (
    <>
      <PageHeader
        title={t("veh.title")}
        description={t("veh.desc")}
        actions={
          <Link to="/admin/vehicles/new" className={adminButton.gold}>
            <Plus className="size-4" aria-hidden />
            {t("veh.add")}
          </Link>
        }
      />
      <Panel>
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t("search")}
              aria-label={t("search")}
              className="h-10 w-full rounded-lg border border-line ps-9 pe-3 text-sm focus:border-navy-900 focus:outline-none"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {[null, ...VEHICLE_STATUSES].map((s) => (
              <button
                key={s ?? "all"}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  "h-10 shrink-0 rounded-lg px-3.5 text-sm font-semibold",
                  status === s ? "bg-navy-900 text-white" : "text-navy-900 hover:bg-paper",
                )}
              >
                {s ? t(`status.${s}`) : t("all")}
                <span className="ms-1.5 opacity-60 tabular-nums">
                  {s ? rows.filter((v) => v.status === s).length : rows.length}
                </span>
              </button>
            ))}
          </div>
        </div>
        {q.isPending ? (
          <Spinner />
        ) : q.isError ? (
          <LoadError />
        ) : list.length === 0 ? (
          <EmptyState text={t("veh.empty")} />
        ) : (
          <ul className="divide-y divide-line">
            {list.map((v) => (
              <Row key={v.id} v={v} onDelete={setDeleting} />
            ))}
          </ul>
        )}
        {q.data?.capped && (
          <p className="mt-4 text-xs text-muted">{t("showing", { n: VEHICLES_LIMIT })}</p>
        )}
      </Panel>
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => void remove()}
        messageKey="veh.deleteConfirm"
        busy={busy}
      />
    </>
  );
}
