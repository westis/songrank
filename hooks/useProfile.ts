"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface UserProfile {
  user_id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

/** Fetch the current user's profile. */
export function useProfile() {
  return useQuery<UserProfile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

/** Fetch a specific user's profile by ID. */
export function useUserProfile(userId: string | undefined) {
  return useQuery<UserProfile | null>({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

/** Fetch profiles for multiple user IDs (for collaborator lists). */
export function useUserProfiles(userIds: string[]) {
  return useQuery<UserProfile[]>({
    queryKey: ["profiles", userIds.sort().join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .in("user_id", userIds);

      if (error) throw error;
      return data ?? [];
    },
    enabled: userIds.length > 0,
  });
}

/** Create or update the current user's display name. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ displayName }: { displayName: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_profiles")
        .upsert(
          {
            user_id: user.id,
            display_name: displayName.trim(),
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
