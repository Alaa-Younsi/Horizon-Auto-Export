import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import { requireSupabase } from "@/lib/supabase";
import type { AdminProfileRow } from "@/types/db";
import type { AdminSection } from "./adminSections";

/**
 * The caller's own admin_profiles row. This MIRRORS the database gate so the UI
 * hides what RLS would refuse — it is never the security boundary itself.
 */
export function useAdminProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const query = useQuery({
    queryKey: ["admin-profile", userId],
    enabled: Boolean(userId),
    staleTime: 60_000,
    queryFn: async (): Promise<AdminProfileRow | null> => {
      const { data, error } = await requireSupabase()
        .from("admin_profiles")
        .select("*")
        .eq("user_id", userId ?? "")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const profile = query.data ?? null;
  const isOwner = Boolean(profile?.active && profile.is_owner);
  const isActive = Boolean(profile?.active);
  const hasSection = (key: string) =>
    isOwner || Boolean(profile?.active && profile.sections.includes(key));
  const canAccess = (s: AdminSection) =>
    isActive && (s.always || (s.ownerOnly ? isOwner : hasSection(s.key)));
  return {
    profile,
    isOwner,
    isActive,
    hasSection,
    canAccess,
    isLoading: query.isPending && Boolean(userId),
    query,
  };
}
