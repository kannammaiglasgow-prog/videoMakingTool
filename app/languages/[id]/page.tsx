"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { GeneratedProject } from "@/types/project";

type Status = "Waiting" | "Ready to render" | "Completed" | "Failed";

function statusOf(p: GeneratedProject): Status {
  const hasSceneError = p.scenes.some((s) => s.assetError);
  const scenesReady = p.scenes.every((s) => s.audioUrl && (s.imageUrl || s.videoClipUrl));

  if (p.generationWarning && !p.assetsGenerated) return "Failed";
  if (!p.assetsGenerated) return "Waiting";
  if (hasSceneError || !scenesReady) return "Failed";
  if (!p.videoUrl) return "Ready to render";
  return "Completed";
}

function failureReason(p: GeneratedProject): string {
  if (p.generationWarning) return p.generationWarning;
  const sceneError = p.scenes.find((s) => s.assetError)?.assetError;
  if (sceneError) return sceneError;
  return "Some scenes are missing an image or voiceover.";
}

function loadProject(id: string): GeneratedProject | null {
  const raw = localStorage.getItem(`project:${id}`);
  return raw ? (JSON.parse(raw) as GeneratedProject) : null;
}

function saveProject(p: GeneratedProject) {
  localStorage.setItem(`project:${p.id}`, JSON.stringify(p));
}

export default function LanguagesPage() {
  const params = useParams<{ id: string }>();
  const [projects, setProjects] = useState<GeneratedProject[] | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const current = loadProject(params.id);
    if (!current) return;
    const group = [
      current,
      ...(current.siblings ?? [])
        .map((s) => loadProject(s.id))
        .filter((p): p is GeneratedProject => p !== null),
    ];
    setProjects(group);
  }, [params.id]);

  function updateProject(updated: GeneratedProject) {
    saveProject(updated);
    setProjects((prev) => prev?.map((p) => (p.id === updated.id ? updated : p)) ?? null);
  }

  function findBase(list: GeneratedProject[]): GeneratedProject {
    return list.find((p) => p.assetsGenerated) ?? list[0];
  }

  async function handleGenerateAll() {
    if (!projects) return;
    setBusyAction("generate-all");
    setError(null);
    try {
      const base = findBase(projects);
      const siblingProjects = projects.filter((p) => p.id !== base.id);
      const res = await fetch("/api/assets/propagate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseProject: base, siblingProjects }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Asset generation failed.");
      }
      const { base: updatedBase, siblings } = (await res.json()) as {
        base: GeneratedProject;
        siblings: GeneratedProject[];
      };
      updateProject(updatedBase);
      siblings.forEach(updateProject);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRender(project: GeneratedProject) {
    setBusyAction(`render-${project.id}`);
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
      updateProject({ ...project, videoUrl: data.videoUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRenderAll() {
    if (!projects) return;
    setBusyAction("render-all");
    setError(null);
    try {
      for (const p of projects) {
        if (p.assetsGenerated && !p.videoUrl) {
          const res = await fetch("/api/render", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ project: p }),
          });
          if (res.ok) {
            const data = await res.json();
            updateProject({ ...p, videoUrl: data.videoUrl });
          }
        }
      }
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRetry(project: GeneratedProject) {
    if (!projects) return;
    setBusyAction(`retry-${project.id}`);
    setError(null);
    try {
      const base = findBase(projects);
      const res = await fetch("/api/generate/retry-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseProject: base, language: project.language, existingId: project.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Retry failed.");
      }
      const updated = await res.json();
      updateProject(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDownloadZip() {
    if (!projects) return;
    setBusyAction("zip");
    setError(null);
    try {
      const ready = projects.filter((p) => p.videoUrl).map((p) => ({ id: p.id, language: p.language }));
      const res = await fetch("/api/projects/zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects: ready }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "ZIP download failed.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "multi-language-videos.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusyAction(null);
    }
  }

  if (!projects) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-zinc-500">
        Loading...
      </div>
    );
  }

  const anyCompleted = projects.some((p) => p.videoUrl);
  const anyReadyToRender = projects.some((p) => p.assetsGenerated && !p.videoUrl);

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Multi-Language Export
          </h1>
          <Link href="/projects" className="text-sm font-medium underline text-zinc-700 dark:text-zinc-300">
            My Projects
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerateAll}
            disabled={busyAction !== null}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {busyAction === "generate-all" ? "Generating..." : "Generate images & voiceover (all)"}
          </button>
          <button
            onClick={handleRenderAll}
            disabled={busyAction !== null || !anyReadyToRender}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {busyAction === "render-all" ? "Rendering..." : "Render all"}
          </button>
          <button
            onClick={handleDownloadZip}
            disabled={busyAction !== null || !anyCompleted}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {busyAction === "zip" ? "Zipping..." : "Download All ZIP"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-col gap-3">
          {projects.map((p) => {
            const status = statusOf(p);
            return (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <Link
                    href={`/preview/${p.id}`}
                    className="text-sm font-medium text-black underline dark:text-zinc-50"
                  >
                    {p.language}
                  </Link>
                  <p
                    className={
                      "text-xs " +
                      (status === "Completed"
                        ? "text-green-600"
                        : status === "Failed"
                          ? "text-red-600"
                          : "text-zinc-500")
                    }
                  >
                    {status}
                    {status === "Failed" ? `: ${failureReason(p)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {status === "Ready to render" && (
                    <button
                      onClick={() => handleRender(p)}
                      disabled={busyAction !== null}
                      className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      {busyAction === `render-${p.id}` ? "Rendering..." : "Render"}
                    </button>
                  )}
                  {status === "Completed" && p.videoUrl && (
                    <a
                      href={p.videoUrl}
                      download
                      className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      Download
                    </a>
                  )}
                  {status === "Failed" && (
                    <button
                      onClick={() => handleRetry(p)}
                      disabled={busyAction !== null}
                      className="rounded-full border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950"
                    >
                      {busyAction === `retry-${p.id}` ? "Retrying..." : `Retry ${p.language}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
