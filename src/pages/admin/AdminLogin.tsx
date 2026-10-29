import { LoaderCircle, LogIn } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Navigate } from "react-router";
import logoLight from "@/assets/logo-full-light.webp";
import { useAuth } from "@/auth/AuthProvider";
import { Input } from "@/components/ui/Field";
import { WorldDots } from "@/components/ui/WorldDots";
import { supabase } from "@/lib/supabase";
import { useAdminT } from "./i18n/AdminI18n";
import { adminButton, FormField } from "./ui/kit";

export default function AdminLogin() {
  const { t } = useAdminT();
  const { session, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (session) return <Navigate to="/admin" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFailed(false);
    const { ok } = await signIn(email, password);
    setBusy(false);
    if (!ok) setFailed(true);
  };

  return (
    <div className="grain relative grid min-h-dvh place-items-center overflow-hidden bg-navy-950 p-4">
      <WorldDots
        pin
        className="absolute top-1/2 left-1/2 w-[min(1400px,160%)] -translate-x-1/2 -translate-y-1/2 text-white/[0.06]"
      />
      <div className="relative w-full max-w-sm">
        <img
          src={logoLight}
          alt="Horizon Auto Export"
          width={384}
          height={300}
          className="mx-auto mb-8 h-28 w-auto"
        />
        <form onSubmit={submit} className="rounded-[24px] bg-white p-8 shadow-2xl">
          <h1 className="font-display text-2xl font-bold text-navy-900">{t("login.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("login.desc")}</p>
          {!supabase ? (
            <p className="mt-6 rounded-xl bg-gold-50 p-4 text-sm text-navy-900 ring-1 ring-gold-200">
              {t("login.notConfigured")}
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              <FormField id="a-email" label={t("email")}>
                <Input
                  id="a-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormField>
              <FormField id="a-password" label={t("login.password")}>
                <Input
                  id="a-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </FormField>
              {failed && (
                <p
                  role="alert"
                  className="rounded-xl bg-gold-50 p-3 text-sm font-medium text-navy-900 ring-1 ring-gold-300"
                >
                  {t("login.error")}
                </p>
              )}
              <button type="submit" disabled={busy} className={`${adminButton.gold} w-full`}>
                {busy ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                ) : (
                  <LogIn className="size-4" aria-hidden />
                )}
                {t("login.submit")}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
