"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useAcceptInvite } from "@/hooks/useCollaborators";

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const acceptInvite = useAcceptInvite();
  const [status, setStatus] = useState<
    "loading" | "ready" | "joining" | "success" | "error" | "need-login"
  >("loading");
  const [message, setMessage] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setStatus("need-login");
      return;
    }
    setStatus("ready");
  }, [user, authLoading]);

  const handleJoin = () => {
    setStatus("joining");
    acceptInvite.mutate(
      { inviteCode: code },
      {
        onSuccess: (result) => {
          setProjectId(result.project.id);
          if (result.alreadyOwner) {
            setMessage(`You own "${result.project.name}".`);
          } else if (result.alreadyMember) {
            setMessage(
              `You're already a member of "${result.project.name}".`
            );
          } else {
            setMessage(`Joined "${result.project.name}" successfully!`);
          }
          setStatus("success");
        },
        onError: (err) => {
          setMessage(
            err instanceof Error ? err.message : "Failed to join project."
          );
          setStatus("error");
        },
      }
    );
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Project Invite</h1>

        {status === "loading" && (
          <p className="mt-4 text-sm text-foreground-muted">Loading...</p>
        )}

        {status === "need-login" && (
          <>
            <p className="mt-4 text-sm text-foreground-muted">
              Sign in to accept this invite and join the project.
            </p>
            <Link
              href={`/login?redirect=/invite/${code}`}
              className="mt-6 inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover"
            >
              Sign In
            </Link>
          </>
        )}

        {status === "ready" && (
          <>
            <p className="mt-4 text-sm text-foreground-muted">
              You&apos;ve been invited to collaborate on a project. Click below
              to join.
            </p>
            <button
              onClick={handleJoin}
              className="mt-6 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover"
            >
              Join Project
            </button>
          </>
        )}

        {status === "joining" && (
          <p className="mt-4 text-sm text-foreground-muted">Joining...</p>
        )}

        {status === "success" && (
          <>
            <p className="mt-4 text-sm text-foreground-muted">{message}</p>
            {projectId && (
              <Link
                href={`/project/${projectId}/battle`}
                className="mt-6 inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover"
              >
                Go to Project
              </Link>
            )}
          </>
        )}

        {status === "error" && (
          <>
            <p className="mt-4 text-sm text-red-400">{message}</p>
            <Link
              href="/"
              className="mt-6 inline-block text-sm text-foreground-muted hover:text-accent"
            >
              Back to Projects
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
