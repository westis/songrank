"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateProject } from "@/hooks/useProjects";

export default function NewProjectPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();
  const createProject = useCreateProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const project = await createProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      router.push(`/project/${project.id}`);
    } catch {
      // error is available via createProject.error
    }
  };

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <div className="animate-fade-slide-up">
        <Link
          href="/"
          className="text-sm text-foreground-muted transition-colors hover:text-accent"
        >
          &larr; Back to Projects
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          New Project
        </h1>
        <p className="mt-1 text-foreground-muted">
          Create a project to start ranking songs by an artist.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="animate-fade-slide-up stagger-1 mt-8 rounded-xl border border-border bg-surface p-6"
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-foreground-muted"
            >
              Project Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder='e.g. "Midnight Oil Rankings"'
              className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-sm font-medium text-foreground-muted"
            >
              Description{" "}
              <span className="text-foreground-subtle">(optional)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What are you ranking?"
              className="w-full resize-none rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {createProject.error && (
          <p className="mt-3 text-sm text-error">
            {(createProject.error as Error).message}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={createProject.isPending || !name.trim()}
            className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {createProject.isPending ? "Creating..." : "Create Project"}
          </button>
          <Link
            href="/"
            className="rounded-lg border border-border px-5 py-2.5 text-sm text-foreground-muted transition-colors hover:border-accent hover:text-accent"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
