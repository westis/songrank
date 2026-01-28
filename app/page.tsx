import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="animate-fade-slide-up flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Projects</h1>
          <p className="mt-1 text-foreground-muted">
            Create and manage your song ranking projects.
          </p>
        </div>
        <Link
          href="/project/new"
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover"
        >
          New Project
        </Link>
      </div>

      <div className="mt-10 grid gap-4">
        {projects && projects.length > 0 ? (
          projects.map((project, i) => (
            <Link
              key={project.id}
              href={`/project/${project.id}`}
              className={`animate-fade-slide-up stagger-${Math.min(i + 1, 8)} group rounded-xl border border-border bg-surface p-6 transition-all hover:border-accent/40 hover:bg-surface-raised`}
            >
              <h2 className="text-lg font-semibold group-hover:text-accent">
                {project.name}
              </h2>
              {project.description && (
                <p className="mt-1 text-sm text-foreground-muted">
                  {project.description}
                </p>
              )}
              <p className="mt-3 text-xs text-foreground-subtle">
                Updated{" "}
                {new Date(project.updated_at).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </Link>
          ))
        ) : (
          <div className="animate-fade-in rounded-xl border border-dashed border-border bg-surface/50 p-12 text-center">
            <p className="text-foreground-muted">No projects yet.</p>
            <p className="mt-1 text-sm text-foreground-subtle">
              Create your first project to start ranking songs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
