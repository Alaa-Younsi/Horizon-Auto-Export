import { ArrowRight, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "@/auth/AuthProvider";
import { cn } from "@/lib/cn";
import { formatDate, formatDateTime } from "@/lib/format";
import { useAdminStats, useInquiries } from "../data";
import { useAdminT } from "../i18n/AdminI18n";
import {
  adminButton,
  EmptyState,
  LoadError,
  PageHeader,
  Panel,
  Spinner,
  StatTile,
} from "../ui/kit";
import { useAdminProfile } from "../useAdminProfile";
import { InquiryStatusBadge } from "./Inquiries";

/** Bars for every day in the window (SQL emits empty days too); hover shows the count. */
function DailyChart({ data }: { data: Array<{ day: string; count: number }> }) {
  const { t, lang } = useAdminT();
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.count));
  const W = 600;
  const H = 160;
  const bw = W / data.length;
  const active = hover !== null ? data[hover] : data[data.length - 1];
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-navy-900">{t("dash.chart")}</p>
        {active && (
          <p className="text-sm text-muted tabular-nums">
            {formatDate(active.day, lang, { day: "numeric", month: "short" })} ·{" "}
            <span className="font-semibold text-navy-900">{active.count}</span>
          </p>
        )}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H + 18}`}
        className="aspect-[600/178] h-auto w-full"
        role="img"
        aria-label={t("dash.chart")}
        onPointerLeave={() => setHover(null)}
      >
        <line x1="0" x2={W} y1={H} y2={H} stroke="var(--color-line)" />
        {data.map((d, i) => {
          const h = (d.count / max) * (H - 8);
          const isHover = hover === i;
          return (
            <g key={d.day} onPointerEnter={() => setHover(i)}>
              {/* full-column hit target: chasing a 6px bar with a finger is how charts become unusable */}
              <rect x={i * bw} y={0} width={bw} height={H} fill="transparent" />
              <rect
                x={i * bw + bw * 0.18}
                y={H - h}
                width={bw * 0.64}
                height={Math.max(h, d.count ? 2 : 0)}
                rx={2}
                fill={isHover ? "var(--color-gold-500)" : "var(--color-navy-700)"}
              />
            </g>
          );
        })}
        {[0, data.length - 1].map((i) => {
          const d = data[i];
          if (!d) return null;
          return (
            <text
              key={d.day}
              x={i === 0 ? 0 : W}
              y={H + 15}
              textAnchor={i === 0 ? "start" : "end"}
              className="fill-muted text-[11px]"
            >
              {formatDate(d.day, lang, { day: "numeric", month: "short" })}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const { t, lang } = useAdminT();
  const { session } = useAuth();
  const { hasSection } = useAdminProfile();
  const stats = useAdminStats();
  const canInquiries = hasSection("inquiries");
  const inquiries = useInquiries();

  if (stats.isPending) return <Spinner />;
  if (stats.isError) return <LoadError />;
  const { vehicles: v, inquiries: q, daily } = stats.data;
  const recent = canInquiries
    ? (inquiries.data?.rows ?? []).filter((r) => r.status !== "spam").slice(0, 6)
    : [];

  return (
    <>
      <PageHeader
        title={t("dash.title")}
        description={`${t("dash.hello")}, ${session?.user.email ?? ""}`}
        actions={
          hasSection("vehicles") && (
            <Link to="/admin/vehicles/new" className={adminButton.gold}>
              <Plus className="size-4" aria-hidden />
              {t("dash.addVehicle")}
            </Link>
          )
        }
      />

      {q && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile accent label={t("dash.newInquiries")} value={q.new} />
          <StatTile label={t("dash.openInquiries")} value={q.open} />
          <StatTile label={t("dash.inquiries30")} value={q.last_30d} />
          <StatTile label={t("dash.won30")} value={q.won_30d} />
        </div>
      )}
      {v && (
        <div className={cn("grid grid-cols-2 gap-4 lg:grid-cols-4", q && "mt-4")}>
          <StatTile label={t("dash.available")} value={v.available} />
          <StatTile label={t("dash.reserved")} value={v.reserved} />
          <StatTile label={t("dash.sold30")} value={v.sold_30d} />
          <StatTile label={t("dash.drafts")} value={v.draft} />
        </div>
      )}

      {canInquiries && (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <Panel>
            {daily && daily.length > 0 ? (
              <DailyChart data={daily} />
            ) : (
              <EmptyState text={t("dash.noData")} />
            )}
          </Panel>
          <Panel
            title={t("dash.recent")}
            actions={
              <Link
                to="/admin/inquiries"
                className="inline-flex items-center gap-1 text-sm font-semibold text-gold-700"
              >
                {t("dash.viewAll")}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            }
          >
            {inquiries.isPending ? (
              <Spinner className="min-h-24" />
            ) : inquiries.isError ? (
              <LoadError />
            ) : recent.length === 0 ? (
              <EmptyState text={t("inq.empty")} />
            ) : (
              <ul className="divide-y divide-line">
                {recent.map((r) => (
                  <li key={r.id}>
                    <Link
                      to={`/admin/inquiries?open=${r.id}`}
                      className="flex items-center justify-between gap-3 py-3 hover:bg-paper/60"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-navy-900">{r.name}</p>
                        <p className="truncate text-xs text-muted">
                          {r.company ? `${r.company} · ` : ""}
                          {formatDateTime(r.created_at, lang)}
                        </p>
                      </div>
                      <InquiryStatusBadge status={r.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </>
  );
}
