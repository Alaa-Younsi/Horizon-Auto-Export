import { useQueryClient } from "@tanstack/react-query";
import { Building2, Download, Mail, MessageCircle, Phone, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Select, Textarea } from "@/components/ui/Field";
import { LANG_META } from "@/i18n/languages";
import { cn } from "@/lib/cn";
import { mailHref, telHref, whatsappHref } from "@/lib/contact";
import { exportXlsx } from "@/lib/export";
import { formatDateTime } from "@/lib/format";
import { requireSupabase } from "@/lib/supabase";
import { INQUIRY_STATUSES, type InquiryRow, type InquiryStatus } from "@/types/db";
import { adminErrorKey } from "../adminErrors";
import { INQUIRIES_LIMIT, invalidateInquiries, useInquiries } from "../data";
import { useAdminT } from "../i18n/AdminI18n";
import {
  adminButton,
  Badge,
  type BadgeTone,
  ConfirmDialog,
  EmptyState,
  LoadError,
  Modal,
  PageHeader,
  Panel,
  Spinner,
  TableWrap,
} from "../ui/kit";
import { useToast } from "../ui/Toast";

const STATUS_TONE: Record<InquiryStatus, BadgeTone> = {
  new: "goldSolid",
  contacted: "navy",
  negotiating: "gold",
  won: "navySolid",
  lost: "gray",
  spam: "gray",
};

export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  const { t } = useAdminT();
  return <Badge tone={STATUS_TONE[status]}>{t(`inq.st.${status}`)}</Badge>;
}

function useUpdateInquiry() {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useAdminT();
  return async (id: string, patch: { status?: InquiryStatus; admin_notes?: string | null }) => {
    const { error } = await requireSupabase().from("inquiries").update(patch).eq("id", id);
    if (error) {
      toast.error(t(adminErrorKey(error)));
      return false;
    }
    invalidateInquiries(qc);
    toast.success(t("saved"));
    return true;
  };
}

function StatusPicker({ row }: { row: InquiryRow }) {
  const { t } = useAdminT();
  const update = useUpdateInquiry();
  const [busy, setBusy] = useState(false);
  return (
    <Select
      aria-label={t("inq.col.status")}
      value={row.status}
      disabled={busy}
      onClick={(e) => e.stopPropagation()}
      onChange={async (e) => {
        setBusy(true);
        await update(row.id, { status: e.target.value as InquiryStatus });
        setBusy(false);
      }}
      className="h-9 w-40 text-sm"
    >
      {INQUIRY_STATUSES.map((s) => (
        <option key={s} value={s}>
          {t(`inq.st.${s}`)}
        </option>
      ))}
    </Select>
  );
}

function Detail({ row, onClose }: { row: InquiryRow; onClose: () => void }) {
  const { t, lang } = useAdminT();
  const update = useUpdateInquiry();
  const qc = useQueryClient();
  const toast = useToast();
  const [notes, setNotes] = useState(row.admin_notes ?? "");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const dirty = notes !== (row.admin_notes ?? "");

  const remove = async () => {
    setBusy(true);
    const { error } = await requireSupabase().from("inquiries").delete().eq("id", row.id);
    setBusy(false);
    if (error) {
      toast.error(t(adminErrorKey(error, "deleteError")));
      return;
    }
    invalidateInquiries(qc);
    setConfirm(false);
    onClose();
  };

  const rows: Array<[string, string | null]> = [
    [t("inq.reference"), row.reference],
    [t("inq.col.received"), formatDateTime(row.created_at, lang)],
    [t("inq.col.subject"), t(`inq.kind.${row.kind}`)],
    [t("inq.vehicle"), row.vehicle_label],
    [t("inq.company"), row.company],
    [t("email"), row.email],
    [t("inq.phone"), row.phone],
    [t("inq.country"), row.country],
    [t("inq.language"), LANG_META[row.language].native],
    [t("inq.consent"), formatDateTime(row.consent_at, lang)],
  ];

  return (
    <Modal open onClose={onClose} title={`${t("inq.detail")} · ${row.name}`} size="lg" busy={busy}>
      <div className="flex flex-wrap items-center gap-3">
        <StatusPicker row={row} />
        <a href={mailHref(row.email, `Re: ${row.reference}`)} className={adminButton.secondary}>
          <Mail className="size-4" aria-hidden />
          {t("inq.reply")}
        </a>
        {row.phone && (
          <a href={telHref(row.phone.replace(/[^\d+]/g, ""))} className={adminButton.secondary}>
            <Phone className="size-4" aria-hidden />
            {t("inq.call")}
          </a>
        )}
        {row.phone?.trim().startsWith("+") && (
          <a
            href={whatsappHref(row.phone.replace(/[^\d+]/g, ""), `${row.reference} — `)}
            target="_blank"
            rel="noopener noreferrer"
            className={adminButton.secondary}
          >
            <MessageCircle className="size-4" aria-hidden />
            {t("inq.whatsapp")}
          </a>
        )}
      </div>
      {row.status === "spam" && (
        <p className="mt-4 rounded-xl bg-gold-50 p-3 text-sm text-navy-900 ring-1 ring-gold-200">
          {t("inq.spamNote")}
        </p>
      )}
      <dl className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {rows
          .filter((r): r is [string, string] => Boolean(r[1]))
          .map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold text-muted">{label}</dt>
              <dd className="mt-0.5 font-medium break-words text-navy-900">{value}</dd>
            </div>
          ))}
      </dl>
      <div className="mt-6">
        <p className="text-xs font-semibold text-muted">{t("inq.message")}</p>
        <p className="mt-2 rounded-xl bg-paper p-4 leading-relaxed whitespace-pre-line text-navy-900">
          {row.message}
        </p>
      </div>
      <div className="mt-6">
        <label htmlFor="inq-notes" className="text-sm font-semibold text-navy-900">
          {t("inq.notes")}
        </label>
        <Textarea
          id="inq-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1.5 min-h-24 text-sm"
          maxLength={4000}
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">{t("inq.notesHint")}</p>
          <button
            type="button"
            className={adminButton.primary}
            disabled={!dirty || busy}
            onClick={async () => {
              setBusy(true);
              await update(row.id, { admin_notes: notes.trim() || null });
              setBusy(false);
            }}
          >
            {t("save")}
          </button>
        </div>
      </div>
      <div className="mt-8 border-t border-line pt-4">
        <button type="button" className={adminButton.danger} onClick={() => setConfirm(true)}>
          <Trash2 className="size-4" aria-hidden />
          {t("delete")}
        </button>
      </div>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => void remove()}
        messageKey="inq.deleteConfirm"
        busy={busy}
      />
    </Modal>
  );
}

const fold = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function Inquiries() {
  const { t, lang } = useAdminT();
  const toast = useToast();
  const q = useInquiries();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState<InquiryStatus | null>(null);
  const [term, setTerm] = useState("");
  const openId = params.get("open");

  const rows = q.data?.rows ?? [];
  const counts = useMemo(() => {
    const c = Object.fromEntries(INQUIRY_STATUSES.map((s) => [s, 0])) as Record<
      InquiryStatus,
      number
    >;
    for (const r of rows) c[r.status] += 1;
    return c;
  }, [rows]);
  const list = useMemo(() => {
    const needle = fold(term.trim());
    return rows.filter((r) => {
      // Spam stays out of "all" — it's only reviewed on purpose.
      if (status ? r.status !== status : r.status === "spam") return false;
      if (!needle) return true;
      return fold(
        [r.name, r.company, r.email, r.phone, r.reference, r.vehicle_label, r.message].join(" "),
      ).includes(needle);
    });
  }, [rows, status, term]);
  const open = rows.find((r) => r.id === openId) ?? null;
  const setOpen = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("open", id);
    else next.delete("open");
    setParams(next, { replace: true });
  };

  const onExport = async () => {
    try {
      await exportXlsx(
        list,
        [
          { header: "Reference", value: (r) => r.reference, width: 22 },
          { header: "Received", value: (r) => formatDateTime(r.created_at, lang), width: 20 },
          { header: "Status", value: (r) => t(`inq.st.${r.status}`), width: 14 },
          { header: "Subject", value: (r) => t(`inq.kind.${r.kind}`), width: 16 },
          { header: "Name", value: (r) => r.name, width: 24 },
          { header: "Company", value: (r) => r.company, width: 24 },
          { header: "E-mail", value: (r) => r.email, width: 28 },
          { header: "Phone", value: (r) => r.phone, width: 18 },
          { header: "Country", value: (r) => r.country, width: 14 },
          { header: "Vehicle", value: (r) => r.vehicle_label, width: 30 },
          { header: "Message", value: (r) => r.message, width: 60 },
          { header: "Notes", value: (r) => r.admin_notes, width: 40 },
        ],
        "inquiries",
      );
    } catch {
      toast.error(t("exportError"));
    }
  };

  return (
    <>
      <PageHeader
        title={t("inq.title")}
        description={t("inq.desc")}
        actions={
          <button
            type="button"
            className={adminButton.secondary}
            disabled={list.length === 0}
            onClick={() => void onExport()}
          >
            <Download className="size-4" aria-hidden />
            {t("export")}
          </button>
        }
      />

      {/* Board rail in pipeline order; scrolls horizontally, never wraps. */}
      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0">
        <button
          type="button"
          onClick={() => setStatus(null)}
          className={cn(
            "shrink-0 rounded-xl px-4 py-2.5 text-start text-sm font-semibold ring-1 transition-colors",
            status === null
              ? "bg-navy-900 text-white ring-navy-900"
              : "bg-white text-navy-900 ring-line hover:bg-paper",
          )}
        >
          {t("all")}{" "}
          <span className="ms-1 tabular-nums opacity-60">{rows.length - counts.spam}</span>
        </button>
        {INQUIRY_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 transition-colors",
              status === s
                ? "bg-navy-900 text-white ring-navy-900"
                : "bg-white text-navy-900 ring-line hover:bg-paper",
            )}
          >
            {t(`inq.st.${s}`)} <span className="ms-1 tabular-nums opacity-60">{counts[s]}</span>
          </button>
        ))}
      </div>

      <Panel>
        <div className="relative mb-5 max-w-sm">
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
        {q.isPending ? (
          <Spinner />
        ) : q.isError ? (
          <LoadError />
        ) : list.length === 0 ? (
          <EmptyState text={t("inq.empty")} />
        ) : (
          <>
            {/* Phones: cards. Desktop: a table in its own scroller. */}
            <ul className="space-y-3 md:hidden">
              {list.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setOpen(r.id)}
                    className="w-full rounded-xl p-4 text-start ring-1 ring-line hover:bg-paper"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-navy-900">{r.name}</p>
                      <InquiryStatusBadge status={r.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {t(`inq.kind.${r.kind}`)} · {formatDateTime(r.created_at, lang)}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-navy-900/80">{r.message}</p>
                  </button>
                </li>
              ))}
            </ul>
            <div className="hidden md:block">
              <TableWrap>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-start text-xs text-muted">
                      <th className="px-6 py-3 text-start font-semibold whitespace-nowrap">
                        {t("inq.col.from")}
                      </th>
                      <th className="px-3 py-3 text-start font-semibold whitespace-nowrap">
                        {t("inq.col.subject")}
                      </th>
                      <th className="px-3 py-3 text-start font-semibold whitespace-nowrap">
                        {t("inq.col.received")}
                      </th>
                      <th className="px-6 py-3 text-start font-semibold whitespace-nowrap">
                        {t("inq.col.status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => setOpen(r.id)}
                        className="cursor-pointer border-b border-line/70 last:border-0 hover:bg-paper/70"
                      >
                        <td className="px-6 py-3.5">
                          <button
                            type="button"
                            onClick={() => setOpen(r.id)}
                            className="text-start"
                          >
                            <span className="block font-semibold whitespace-nowrap text-navy-900">
                              {r.name}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs whitespace-nowrap text-muted">
                              {r.company && <Building2 className="size-3" aria-hidden />}
                              {r.company ?? r.email}
                            </span>
                          </button>
                        </td>
                        <td className="max-w-[320px] px-3 py-3.5">
                          <span className="block font-medium whitespace-nowrap text-navy-900">
                            {t(`inq.kind.${r.kind}`)}
                          </span>
                          <span className="block truncate text-xs text-muted">
                            {r.vehicle_label ?? r.message}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap text-muted">
                          {formatDateTime(r.created_at, lang)}
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusPicker row={r} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </div>
            {q.data?.capped && (
              <p className="mt-4 text-xs text-muted">{t("showing", { n: INQUIRIES_LIMIT })}</p>
            )}
          </>
        )}
      </Panel>
      {open && <Detail key={open.id + open.updated_at} row={open} onClose={() => setOpen(null)} />}
    </>
  );
}
