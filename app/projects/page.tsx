"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ProjectSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then(setProjects)
      .catch(() => setProjects([]));
  }, []);

  async function handleDelete(id: string) {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setProjects((prev) => prev?.filter((p) => p.id !== id) ?? null);
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">My Projects</h1>
          <Link
            href="/create"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            + New video
          </Link>
        </div>

        {!projects && <p className="text-sm text-zinc-500">Loading...</p>}
        {projects && projects.length === 0 && (
          <p className="text-sm text-zinc-500">
            No saved projects yet. Generate a video and save it from the preview page.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {projects?.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div>
                <Link
                  href={`/preview/${p.id}`}
                  className="text-sm font-medium text-black underline dark:text-zinc-50"
                >
                  {p.title}
                </Link>
                <p className="text-xs text-zinc-500">
                  Updated {new Date(p.updatedAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
