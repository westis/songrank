"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import ProjectShell from "@/components/project/ProjectShell";
import { useProject, useUpdateProject } from "@/hooks/useProjects";
import {
  useInviteCode,
  useCollaborators,
  useRemoveCollaborator,
} from "@/hooks/useCollaborators";
import Loading from "@/components/shared/Loading";

const LEVEL_OPTIONS = [
  {
    value: 1,
    label: "Win / Draw only",
    description: "Simplest — just pick the better song or call it a draw.",
  },
  {
    value: 2,
    label: "2 levels (Clear / Slight / Draw)",
    description:
      "Distinguish between a clear preference and a slight edge. Slight wins influence ratings less.",
  },
  {
    value: 3,
    label: "3 levels (Clear / Moderate / Slight / Draw)",
    description:
      "Three tiers of certainty for more nuanced preferences.",
  },
  {
    value: 4,
    label: "4 levels (Obvious / Clear / Slight / Coin-flip / Draw)",
    description:
      "Maximum granularity. Coin-flip wins barely move the needle; obvious wins have full impact.",
  },
];

export default function SettingsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading } = useProject(projectId);
  const updateProject = useUpdateProject();
  const { data: inviteCode } = useInviteCode(projectId);
  const { data: collaborators } = useCollaborators(projectId);
  const removeCollaborator = useRemoveCollaborator();
  const [copied, setCopied] = useState(false);

  const currentLevel = project?.confidence_levels ?? 1;

  const inviteUrl =
    typeof window !== "undefined" && inviteCode
      ? `${window.location.origin}/invite/${inviteCode}`
      : "";

  const handleCopyInvite = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ProjectShell projectId={projectId}>
      {isLoading ? (
        <Loading text="Loading settings..." />
      ) : (
        <div className="max-w-xl space-y-8">
          <div>
            <h2 className="text-xl font-bold">Project Settings</h2>
            <p className="mt-1 text-sm text-foreground-muted">
              Configure how battles work for this project.
            </p>
          </div>

          {/* Invite / Collaborators */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold">Collaborators</h3>
              <p className="mt-0.5 text-xs text-foreground-muted">
                Invite friends to battle and compare rankings.
              </p>
            </div>

            {/* Invite link */}
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={inviteUrl || "Loading..."}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground-muted focus:outline-none"
              />
              <button
                onClick={handleCopyInvite}
                disabled={!inviteUrl}
                className="shrink-0 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>

            {/* Collaborator list */}
            {collaborators && collaborators.length > 0 && (
              <div className="rounded-lg border border-border">
                {collaborators.map((c) => (
                  <div
                    key={c.user_id}
                    className="flex items-center justify-between border-b border-border px-4 py-2.5 last:border-b-0"
                  >
                    <div>
                      <span className="text-sm font-medium">
                        {c.display_name}
                      </span>
                      <span className="ml-2 rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-medium text-foreground-subtle">
                        {c.role}
                      </span>
                    </div>
                    {c.role === "collaborator" && (
                      <button
                        onClick={() =>
                          removeCollaborator.mutate({
                            projectId,
                            userId: c.user_id,
                          })
                        }
                        className="text-xs text-foreground-subtle transition-colors hover:text-error"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confidence levels */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold">Battle Detail Level</h3>
              <p className="mt-0.5 text-xs text-foreground-muted">
                How many levels of certainty should be available when picking a
                winner? More levels let you express subtle preferences, but add
                friction to each battle.
              </p>
            </div>

            {updateProject.isError && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                Failed to update setting. Make sure the{" "}
                <code className="font-mono text-xs">confidence_levels</code>{" "}
                column exists in your database (run the migration).
              </p>
            )}

            <div className="space-y-2">
              {LEVEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    if (opt.value !== currentLevel) {
                      updateProject.mutate({
                        projectId,
                        updates: { confidence_levels: opt.value },
                      });
                    }
                  }}
                  disabled={updateProject.isPending}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition-all disabled:opacity-50 ${
                    currentLevel === opt.value
                      ? "border-accent bg-accent-subtle"
                      : "border-border hover:border-accent/40"
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      currentLevel === opt.value
                        ? "text-accent"
                        : "text-foreground"
                    }`}
                  >
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </ProjectShell>
  );
}
