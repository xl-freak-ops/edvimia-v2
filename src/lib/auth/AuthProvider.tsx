import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "./roles";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  school_id: string | null;
};

type School = {
  id: string;
  name: string;
  school_type: string;
  country: string;
  state: string | null;
};

type AuthContextValue = {
  loading: boolean;
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  school: School | null;
  roles: AppRole[];
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = React.useState(true);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [school, setSchool] = React.useState<School | null>(null);
  const [roles, setRoles] = React.useState<AppRole[]>([]);

  const loadUserData = React.useCallback(async (uid: string) => {
    const [{ data: prof }, { data: roleRows }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, phone, avatar_url, school_id")
        .eq("id", uid)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    let profile = (prof as Profile) ?? null;
    let roleList = ((roleRows ?? []) as { role: AppRole }[]).map((r) => r.role);

    // Self-heal: if the user is missing a role or a school workspace, create
    // one via the server-side RPC. This prevents "Access denied" lockouts
    // for accounts that pre-date the auth trigger or lost their workspace.
    if (!profile || !profile.school_id || roleList.length === 0) {
      const { error: rpcErr } = await supabase.rpc("ensure_my_workspace", {
        _school_name: "My School",
      });
      if (!rpcErr) {
        const [{ data: p2 }, { data: r2 }] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, email, phone, avatar_url, school_id")
            .eq("id", uid)
            .maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", uid),
        ]);
        profile = (p2 as Profile) ?? profile;
        roleList = ((r2 ?? []) as { role: AppRole }[]).map((r) => r.role);
      }
    }

    setProfile(profile);
    setRoles(roleList);
    if (profile?.school_id) {
      const { data: sch } = await supabase
        .from("schools")
        .select("id, name, school_type, country, state")
        .eq("id", profile.school_id)
        .maybeSingle();
      setSchool((sch as School) ?? null);
    } else {
      setSchool(null);
    }
  }, []);

  const refresh = React.useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const u = data.user;
    if (!u) {
      setUserId(null);
      setEmail(null);
      setProfile(null);
      setSchool(null);
      setRoles([]);
      return;
    }
    setUserId(u.id);
    setEmail(u.email ?? null);
    await loadUserData(u.id);
  }, [loadUserData]);

  React.useEffect(() => {
    let mounted = true;
    // Register listener first
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const u = session?.user;
      if (u) {
        setUserId(u.id);
        setEmail(u.email ?? null);
        // Defer DB calls to avoid deadlocks inside the callback
        setTimeout(() => {
          if (mounted) loadUserData(u.id);
        }, 0);
      } else {
        setUserId(null);
        setEmail(null);
        setProfile(null);
        setSchool(null);
        setRoles([]);
      }
    });
    // Then hydrate
    (async () => {
      await refresh();
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadUserData, refresh]);

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({ loading, userId, email, profile, school, roles, signOut, refresh }),
    [loading, userId, email, profile, school, roles, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}