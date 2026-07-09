"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { GeneratedProject } from "@/types/project";

export default function RenderPage() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<GeneratedProject | null>(null);
  const [status, setStatus] = useState<"idle" | "rendering" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(`project:${params.id}`);
    if (!raw) return;
    const parsed: GeneratedProject = JSON.parse(raw);
    setProject(parsed);
    if (parsed.videoUrl) {
      setVideoUrl(parsed.videoUrl);
      setStatus("done");
    }
  }, [params.id]);

  async function handleRender() {
    if (!project) return;
    setStatus("rendering");
    setError(null);
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Render failed.");
      }
      const data = await res.json();
      const updated = { ...project, videoUrl: data.videoUrl };
      localStorage.setItem(`project:${project.id}`, JSON.stringify(updated));
      setProject(updated);
      setVideoUrl(data.videoUrl);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">{project.title}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Render the final {project.duration}s vertical video (1080x1920, 30fps, H.264/AAC).
        </p>

        {status !== "done" && (
          <button
            onClick={handleRender}
            disabled={status === "rendering"}
            className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {status === "rendering" ? "Rendering video..." : "Render final video"}
          </button>
        )}

        {status === "error" && <p className="text-sm text-red-600">{error}</p>}

        {status === "done" && videoUrl && (
          <div className="flex flex-col items-center gap-4">
            <video
              controls
              src={videoUrl}
              className="max-h-[70vh] w-auto rounded-lg border border-zinc-200 dark:border-zinc-800"
            />
            <a
              href={videoUrl}
              download
              className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Download MP4
            </a>
          </div>
        )}

        <Link
          href={`/preview/${project.id}`}
          className="text-sm font-medium underline text-zinc-700 dark:text-zinc-300"
        >
          ← Back to preview
        </Link>
      </div>
    </div>
  );
}
