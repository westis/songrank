"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ProjectCollaborator } from "@/lib/types";

const supabase = createClient();

export interface CollaboratorWithProfile {
  project_id: string;
  user_id: string;
  role: "owner" | "collaborator";
  joined_at: string;
  display_name: string;
  email?: string;
}

/** Fetch all collaborators for a project, with display names. */
export function useCollaborators(projectId: string) {
  return useQuery<CollaboratorWithProfile[]>({
    queryKey: ["collaborators", projectId],
    queryFn: async () => {
      // Get project owner
      const { data: project } = await supabase
        .from("projects")
        .select("owner_id")
        .eq("id", projectId)
        .single();

      if (!project) return [];

      // Get collaborators
      const { data: collabs } = await supabase
        .from("project_collaborators")
        .select("*")
        .eq("project_id", projectId);

      // Collect all user IDs (owner + collaborators)
      const allUserIds = [
        project.owner_id,
        ...(collabs ?? []).map((c) => c.user_id),
      ];

      // Fetch profiles for all users
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("*")
        .in("user_id", allUserIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.user_id, p.display_name])
      );

      // Build result: owner first, then collaborators
      const result: CollaboratorWithProfile[] = [
        {
          project_id: projectId,
          user_id: project.owner_id,
          role: "owner",
          joined_at: "",
          display_name: profileMap.get(project.owner_id) || "Owner",
        },
        ...(collabs ?? [])
          .filter((c) => c.user_id !== project.owner_id) // avoid duplicate if owner is also in collaborators
          .map((c) => ({
            project_id: c.project_id,
            user_id: c.user_id,
            role: c.role as "owner" | "collaborator",
            joined_at: c.joined_at,
            display_name:
              profileMap.get(c.user_id) || "Unnamed collaborator",
          })),
      ];

      return result;
    },
    enabled: !!projectId,
  });
}

/** Get the invite code for a project (owner only). */
export function useInviteCode(projectId: string) {
  return useQuery<string | null>({
    queryKey: ["invite-code", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("invite_code")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      return data?.invite_code ?? null;
    },
    enabled: !!projectId,
  });
}

/** Accept an invite by code: look up the project and add the current user as a collaborator. */
export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inviteCode }: { inviteCode: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Look up project by invite code
      const { data: project, error: projError } = await supabase
        .from("projects")
        .select("id, name, owner_id")
        .eq("invite_code", inviteCode)
        .single();

      if (projError || !project) {
        throw new Error("Invalid invite link");
      }

      // Don't add owner as collaborator
      if (project.owner_id === user.id) {
        return { project, alreadyOwner: true };
      }

      // Check if already a collaborator
      const { data: existing } = await supabase
        .from("project_collaborators")
        .select("user_id")
        .eq("project_id", project.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        return { project, alreadyMember: true };
      }

      // Insert collaborator
      const { error: insertError } = await supabase
        .from("project_collaborators")
        .insert({
          project_id: project.id,
          user_id: user.id,
          role: "collaborator",
        });

      if (insertError) throw insertError;

      return { project, joined: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["collaborators"] });
    },
  });
}

/** Remove a collaborator from a project (owner only). */
export function useRemoveCollaborator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      userId,
    }: {
      projectId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from("project_collaborators")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", userId);

      if (error) throw error;
      return { projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({
        queryKey: ["collaborators", projectId],
      });
    },
  });
}
