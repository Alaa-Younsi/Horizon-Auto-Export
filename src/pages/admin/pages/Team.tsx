import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, LoaderCircle, Power, ShieldCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { requireSupabase } from "@/lib/supabase";
import type { AdminProfileRow } from "@/types/db";
import { adminErrorKey, functionErrorKey } from "../adminErrors";
import { GRANTABLE_SECTIONS } from "../adminSections";
import { adminKeys } from "../data";
import { useAdminT } from "../i18n/AdminI18n";
import {
  adminButton,
  Badge,
  EmptyState,
  FormField,
  LoadError,
  PageHeader,
  Panel,
  Spinner,
} from "../ui/kit";
import { useToast } from "../ui/Toast";

function SectionChecks({
  value,
  onChange,
  idPrefix,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  idPrefix: string;
}) {
  const { t } = useAdminT();
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {GRANTABLE_SECTIONS.map((s) => {
        const on = value.includes(s.key);
        const Icon = s.icon;
        return (
          <label
            key={s.key}
            htmlFor={`${idPrefix}-${s.key}`}
            className={cn(
              "flex cursor-pointer items-center gap-2.5 rounded-xl p-3 text-sm font-medium ring-1 transition-colors",
              on
                ? "bg-gold-50 text-navy-900 ring-gold-500"
                : "text-navy-900 ring-line hover:bg-paper",
            )}
          >
            <input
              id={`${idPrefix}-${s.key}`}
              type="checkbox"
              checked={on}
              onChange={() => onChange(on ? value.filter((k) => k !== s.key) : [...value, s.key])}
              className="size-4 accent-navy-900"
            />
            <Icon className="size-4 shrink-0" aria-hidden />
            {t(s.labelKey)}
          </label>
        );
      })}
    </div>
  );
}

export default function Team() {
  const { t } = useAdminT();
  const {
    data = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: adminKeys.staff,
    queryFn: async (): Promise<AdminProfileRow[]> => {
      const { data: rows, error } = await requireSupabase()
        .from("admin_profiles")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return rows;
    },
  });
  const staff = data.filter((p) => !p.is_owner);

  return (
    <>
      <PageHeader title={t("team.title")} description={t("team.desc")} />
      <div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]">
        <CreateStaff />
        <Panel title={t("team.title")}>
          {isPending ? (
            <Spinner />
          ) : isError ? (
            <LoadError />
          ) : staff.length === 0 ? (
            <EmptyState text={t("team.empty")} />
          ) : (
            <ul className="space-y-4">
              {staff.map((p) => (
                <StaffRow key={`${p.user_id}-${p.sections.join()}-${p.active}`} profile={p} />
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function CreateStaff() {
  const { t } = useAdminT();
  const qc = useQueryClient();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [sections, setSections] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const invalid = !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) || password.length < 8;

  const submit = async () => {
    setBusy(true);
    const { error } = await requireSupabase().functions.invoke("create-staff", {
      body: { email: email.trim().toLowerCase(), password, full_name: fullName.trim(), sections },
    });
    setBusy(false);
    if (error) {
      toast.error(t(await functionErrorKey(error)));
      return;
    }
    toast.success(t("team.created"));
    setEmail("");
    setFullName("");
    setPassword("");
    setSections([]);
    void qc.invalidateQueries({ queryKey: adminKeys.staff });
  };

  return (
    <Panel title={t("team.create")}>
      <div className="space-y-4">
        <FormField id="tm-name" label={t("team.name")}>
          <Input id="tm-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </FormField>
        <FormField id="tm-email" label={t("email")} required>
          <Input
            id="tm-email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormField>
        <FormField id="tm-pass" label={t("team.password")} hint={t("team.passwordHint")} required>
          <Input
            id="tm-pass"
            type="text"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>
        <div>
          <p className="mb-2 text-sm font-semibold text-navy-900">{t("team.sections")}</p>
          <SectionChecks value={sections} onChange={setSections} idPrefix="new" />
        </div>
        <button
          type="button"
          className={adminButton.primary}
          disabled={busy || invalid}
          onClick={() => void submit()}
        >
          {busy ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <UserPlus className="size-4" aria-hidden />
          )}
          {t("create")}
        </button>
      </div>
    </Panel>
  );
}

function StaffRow({ profile }: { profile: AdminProfileRow }) {
  const { t } = useAdminT();
  const qc = useQueryClient();
  const toast = useToast();
  const [sections, setSections] = useState(profile.sections);
  const [busy, setBusy] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwDone, setPwDone] = useState(false);
  const dirty = [...sections].sort().join() !== [...profile.sections].sort().join();

  const update = async (patch: Partial<Pick<AdminProfileRow, "sections" | "active">>) => {
    setBusy(true);
    const { error } = await requireSupabase()
      .from("admin_profiles")
      .update(patch)
      .eq("user_id", profile.user_id);
    setBusy(false);
    if (error) {
      toast.error(t(adminErrorKey(error)));
      return;
    }
    toast.success(t("saved"));
    void qc.invalidateQueries({ queryKey: adminKeys.staff });
  };

  const setStaffPassword = async () => {
    setPwBusy(true);
    setPwDone(false);
    const { error } = await requireSupabase().functions.invoke("set-staff-password", {
      body: { user_id: profile.user_id, password },
    });
    setPwBusy(false);
    if (error) {
      toast.error(t(await functionErrorKey(error)));
      return;
    }
    setPassword("");
    setPwDone(true);
  };

  return (
    <li className={cn("rounded-2xl p-4 ring-1 ring-line", !profile.active && "opacity-70")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-semibold text-navy-900">
            <ShieldCheck className="size-4 text-gold-500" aria-hidden />
            {profile.full_name || profile.email}
          </p>
          <p className="text-xs text-muted">{profile.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {!profile.active && <Badge tone="gray">{t("team.inactive")}</Badge>}
          <button
            type="button"
            className={adminButton.secondary}
            disabled={busy}
            onClick={() => void update({ active: !profile.active })}
          >
            <Power className="size-4" aria-hidden />
            {profile.active ? t("team.deactivate") : t("team.activate")}
          </button>
        </div>
      </div>
      <div className="mt-4">
        <SectionChecks value={sections} onChange={setSections} idPrefix={profile.user_id} />
      </div>
      {dirty && (
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            className={adminButton.secondary}
            onClick={() => setSections(profile.sections)}
            disabled={busy}
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            className={adminButton.primary}
            onClick={() => void update({ sections })}
            disabled={busy}
          >
            {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            {t("save")}
          </button>
        </div>
      )}
      <div className="mt-3 border-t border-line pt-3">
        {/* Collapsed by default: it sits next to "Deactivate"; an always-open box is a mis-tap waiting to happen. */}
        {!pwOpen ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-semibold text-navy-900 hover:text-gold-700"
            onClick={() => setPwOpen(true)}
          >
            <KeyRound className="size-4" aria-hidden />
            {t("team.setPassword")}
          </button>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <FormField
              id={`pw-${profile.user_id}`}
              label={t("team.newPassword")}
              hint={t("team.passwordHint")}
              className="min-w-56 flex-1"
            >
              <Input
                id={`pw-${profile.user_id}`}
                type="text"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormField>
            <button
              type="button"
              className={adminButton.primary}
              disabled={pwBusy || password.length < 8}
              onClick={() => void setStaffPassword()}
            >
              {pwBusy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
              {t("save")}
            </button>
            <button
              type="button"
              className={adminButton.secondary}
              onClick={() => setPwOpen(false)}
            >
              {t("cancel")}
            </button>
          </div>
        )}
        {pwDone && (
          <p className="mt-2 rounded-xl bg-gold-50 p-3 text-sm text-navy-900 ring-1 ring-gold-200">
            {t("team.passwordSet")}
          </p>
        )}
      </div>
    </li>
  );
}
