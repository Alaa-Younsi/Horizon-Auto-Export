import type { Session } from "@supabase/supabase-js";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean }>;
  signOut: () => Promise<void>;
  /**
   * Re-verify the current password, then set a new one. `updateUser` alone asks
   * for no proof — the access token is all it checks — so without this anyone at
   * an unattended open session could lock the owner out.
   */
  changePassword: (
    current: string,
    next: string,
  ) => Promise<"ok" | "wrong" | "same" | "weak" | "error">;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** ONE auth listener for the whole app (not one per component that needs it). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      async signIn(email, password) {
        if (!supabase) return { ok: false };
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        return { ok: !error };
      },
      async signOut() {
        await supabase?.auth.signOut();
      },
      async changePassword(current, next) {
        if (!supabase || !session?.user.email) return "error";
        if (next.length < 8) return "weak";
        if (next === current) return "same";
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: session.user.email,
          password: current,
        });
        if (authError) return "wrong";
        const { error } = await supabase.auth.updateUser({ password: next });
        if (!error) return "ok";
        // GoTrue has no stable codes for these; never show its English text raw.
        if (/should be different/i.test(error.message)) return "same";
        if (/at least|too short|weak/i.test(error.message)) return "weak";
        return "error";
      },
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
