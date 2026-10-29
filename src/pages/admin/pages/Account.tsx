import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { Input } from "@/components/ui/Field";
import { requireSupabase } from "@/lib/supabase";
import type { NotificationPrefsRow } from "@/types/db";
import { adminErrorKey } from "../adminErrors";
import { useAdminT } from "../i18n/AdminI18n";
import type { AdminKey } from "../i18n/en";
import { adminButton, Badge, FormField, PageHeader, Panel, Spinner, Toggle } from "../ui/kit";
import { useToast } from "../ui/Toast";
import { useAdminProfile } from "../useAdminProfile";

export default function Account() {
  const { t } = useAdminT();
  const { session } = useAuth();
  const { isOwner } = useAdminProfile();
  return (
    <>
      <PageHeader title={t("acc.title")} description={t("acc.desc")} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel>
          <p className="font-semibold text-navy-900">{session?.user.email}</p>
          <div className="mt-2">
            <Badge tone={isOwner ? "goldSolid" : "navy"}>
              {isOwner ? t("team.owner") : t("acc.worker")}
            </Badge>
          </div>
          <PasswordForm />
        </Panel>
        <NotificationPrefs />
      </div>
    </>
  );
}

function PasswordForm() {
  const { t } = useAdminT();
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; key: AdminKey } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    // Distinct messages per failure — one generic "failed" reads as a broken form.
    if (next.length < 8) return setStatus({ ok: false, key: "acc.weak" });
    if (next !== confirm) return setStatus({ ok: false, key: "acc.mismatch" });
    setBusy(true);
    const r = await changePassword(current, next);
    setBusy(false);
    const keys = {
      ok: "acc.updated",
      wrong: "acc.wrong",
      same: "acc.same",
      weak: "acc.weak",
      error: "saveError",
    } as const;
    setStatus({ ok: r === "ok", key: keys[r] });
    if (r === "ok") {
      setCurrent("");
      setNext("");
      setConfirm("");
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4 border-t border-line pt-6">
      <h2 className="font-semibold text-navy-900">{t("acc.changePassword")}</h2>
      <FormField id="ac-cur" label={t("acc.current")}>
        <Input
          id="ac-cur"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
      </FormField>
      <FormField id="ac-new" label={t("acc.new")}>
        <Input
          id="ac-new"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
        />
      </FormField>
      <FormField id="ac-conf" label={t("acc.confirm")}>
        <Input
          id="ac-conf"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </FormField>
      {status && (
        <p
          role="status"
          className={
            status.ok
              ? "rounded-xl bg-navy-50 p-3 text-sm text-navy-900 ring-1 ring-navy-100"
              : "rounded-xl bg-gold-50 p-3 text-sm text-navy-900 ring-1 ring-gold-300"
          }
        >
          {t(status.key)}
        </p>
      )}
      <button type="submit" className={adminButton.primary} disabled={busy}>
        {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
        {t("save")}
      </button>
    </form>
  );
}

function NotificationPrefs() {
  const { session } = useAuth();
  const userId = session?.user.id ?? "";
  const { data, isPending } = useQuery({
    queryKey: ["admin", "notify-prefs", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<NotificationPrefsRow | null> => {
      const { data: row, error } = await requireSupabase()
        .from("admin_notification_prefs")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return row;
    },
  });
  if (isPending) return <Spinner />;
  return (
    <PrefsForm
      key={data?.updated_at ?? "new"}
      userId={userId}
      row={data ?? null}
      defaultEmail={session?.user.email ?? ""}
    />
  );
}

function PrefsForm({
  userId,
  row,
  defaultEmail,
}: {
  userId: string;
  row: NotificationPrefsRow | null;
  defaultEmail: string;
}) {
  const { t } = useAdminT();
  const qc = useQueryClient();
  const toast = useToast();
  const [enabled, setEnabled] = useState(row?.email_enabled ?? false);
  const [email, setEmail] = useState(row?.notify_email ?? defaultEmail);
  const [busy, setBusy] = useState(false);
  const invalid = enabled && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  const save = async () => {
    setBusy(true);
    const { error } = await requireSupabase()
      .from("admin_notification_prefs")
      .upsert(
        {
          user_id: userId,
          email_enabled: enabled,
          notify_email: email.trim() || null,
        },
        { onConflict: "user_id" },
      );
    setBusy(false);
    if (error) {
      toast.error(t(adminErrorKey(error)));
      return;
    }
    toast.success(t("saved"));
    void qc.invalidateQueries({ queryKey: ["admin", "notify-prefs", userId] });
  };

  return (
    <Panel title={t("acc.notify")}>
      <div className="space-y-4">
        <p className="text-sm text-muted">{t("acc.notifyDesc")}</p>
        <Toggle checked={enabled} onChange={setEnabled} label={t("acc.notifyOn")} />
        {enabled && (
          <FormField
            id="np-email"
            label={t("acc.notifyEmail")}
            error={invalid ? t("form.err.email") : undefined}
          >
            <Input
              id="np-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>
        )}
        <button
          type="button"
          className={adminButton.primary}
          disabled={busy || invalid}
          onClick={() => void save()}
        >
          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {t("save")}
        </button>
      </div>
    </Panel>
  );
}
