import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/auth/roles";

const rolesKeys = {
  users: (schoolId: string) => ["school", schoolId, "admin-users"] as const,
};

export type SchoolUser = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  roles: AppRole[];
  created_at: string;
};

export function useSchoolUsers(schoolId: string | null | undefined) {
  return useQuery({
    enabled: !!schoolId,
    queryKey: schoolId ? rolesKeys.users(schoolId) : ["school-users-none"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_school_users", {
        _school_id: schoolId!,
      });
      if (error) throw error;
      return (data ?? []) as SchoolUser[];
    },
  });
}

export function useAssignRole(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.rpc("admin_assign_role", {
        _school_id: schoolId,
        _user_id: userId,
        _role: role,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: rolesKeys.users(schoolId) }),
  });
}

export function useRevokeRole(schoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.rpc("admin_revoke_role", {
        _school_id: schoolId,
        _user_id: userId,
        _role: role,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: rolesKeys.users(schoolId) }),
  });
}
