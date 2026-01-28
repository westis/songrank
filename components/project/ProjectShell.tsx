"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProject } from "@/hooks/useProjects";

interface ProjectShellProps {
  projectId: string;
  children: React.ReactNode;
}

export default function ProjectShell({
  projectId,
  children,
}: ProjectShellProps) {
  const pathname = usePathname();
  const { data: project } = useProject(projectId);

  const base = `/project/${projectId}`;
  const isBattle =
    pathname === base ||
    pathname === `${base}/battle` ||
    pathname.startsWith(`${base}/battle/`);
  const isRankings = pathname.startsWith(`${base}/rankings`);
  const isManage =
    pathname.startsWith(`${base}/songs`) ||
    pathname.startsWith(`${base}/import`) ||
    pathname.startsWith(`${base}/settings`);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Header */}
      <div className="animate-fade-slide-up flex items-center justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/"
            className="text-sm text-foreground-muted transition-colors hover:text-accent"
          >
            &larr; Projects
          </Link>
          {project ? (
            <h1 className="mt-1 truncate text-xl font-bold tracking-tight sm:text-2xl">
              {project.name}
            </h1>
          ) : (
            <div className="mt-2 h-7 w-48 animate-pulse rounded bg-surface-raised" />
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isManage && (
            <Link
              href={`${base}/settings`}
              className="rounded-lg border border-border p-1.5 text-foreground-muted transition-colors hover:border-accent hover:text-accent"
              title="Project settings"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </Link>
          )}
          <Link
            href={isManage ? `${base}/battle` : `${base}/songs`}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              isManage
                ? "border-accent text-accent"
                : "border-border text-foreground-muted hover:border-accent hover:text-accent"
            }`}
          >
            {isManage ? "\u2190 Back to Battle" : "Manage Songs"}
          </Link>
        </div>
      </div>

      {/* Primary tabs */}
      {!isManage && (
        <nav className="animate-fade-slide-up stagger-1 mt-4 flex gap-1 border-b border-border">
          <NavTab href={`${base}/battle`} active={isBattle}>
            Battle
          </NavTab>
          <NavTab href={`${base}/rankings`} active={isRankings}>
            Rankings
          </NavTab>
        </nav>
      )}

      {/* Content */}
      <div className={isManage ? "mt-6" : "mt-6"}>{children}</div>
    </div>
  );
}

function NavTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
        active
          ? "border-accent text-accent"
          : "border-transparent text-foreground-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
