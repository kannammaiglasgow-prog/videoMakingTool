"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { GeneratedProject } from "@/types/project";

export default function PreviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<GeneratedProject | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [generatingAssets, setGeneratingAssets] = useState(false);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [regeneratingScene, setRegeneratingScene] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    const raw = localStorage.getItem(`project:${params.id}`);
    if (raw) {
      setProject(JSON.parse(raw));
      return;
    }
    fetch(`/api/projects/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data: GeneratedProject) => {
        localStorage.setItem(`project:${data.id}`, JSON.stringify(data));
        setProject(data);
      })
      .catch(() => setNotFound(true));
  }, [params.id]);

  function persist(updated: GeneratedProject) {
    localStorage.setItem(`project:${updated.id}`, JSON.stringify(updated));
    setProject(updated);
  }

  async function handleGenerateAssets() {
    if (!project) return;
    setGeneratingAssets(true);
    setAssetsError(null);
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Asset generation failed.");
      }
      const updated = await res.json();
      persist(updated);
    } catch (err) {
      setAssetsError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setGeneratingAssets(false);
    }
  }

  async function handleRegenerateScene(sceneNumber: number) {
    if (!project) return;
    setRegeneratingScene(sceneNumber);
    setAssetsError(null);
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, sceneNumbers: [sceneNumber] }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Scene regeneration failed.");
      }
      const updated = await res.json();
      persist(updated);
    } catch (err) {
      setAssetsError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setRegeneratingScene(null);
    }
  }

  async function handleSaveProject() {
    if (!project) return;
    setSaveStatus("saving");
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project }),
    });
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }

  function updateScript(value: string) {
    if (!project) return;
    persist({ ...project, script: value });
  }

  function updateScene(sceneNumber: number, field: "voiceover" | "subtitle" | "imagePrompt", value: string) {
    if (!project) return;
    const scenes = project.scenes.map((s) =>
      s.scene === sceneNumber ? { ...s, [field]: value } : s
    );
    persist({ ...project, scenes });
  }

  if (notFound) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
        <p className="text-zinc-600 dark:text-zinc-400">Project not found.</p>
        <Link href="/create" className="text-sm font-medium underline">
          Create a new video
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-zinc-500">
        Loading...
      </div>
    );
  }

  const textareaClass =
    "w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200";

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col gap-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">{project.title}</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {project.duration}s · {project.language} · {project.tone} · {project.style} ·{" "}
              {project.voice}
            </p>
          </div>
          <Link
            href="/projects"
            className="whitespace-nowrap text-sm font-medium underline text-zinc-700 dark:text-zinc-300"
          >
            My Projects
          </Link>
        </div>

        {project.generationWarning && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
            {project.generationWarning}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setEditing((e) => !e)}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {editing ? "Done editing" : "Edit script & scenes"}
          </button>
          <button
            onClick={handleSaveProject}
            disabled={saveStatus === "saving"}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved ✓" : "Save project"}
          </button>
        </div>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Voiceover Script
          </h2>
          {editing ? (
            <textarea
              className={textareaClass + " min-h-24"}
              value={project.script}
              onChange={(e) => updateScript(e.target.value)}
            />
          ) : (
            <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">{project.script}</p>
          )}
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerateAssets}
            disabled={generatingAssets}
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {generatingAssets
              ? "Generating images & voiceover..."
              : project.assetsGenerated
                ? "Regenerate images & voiceover"
                : "Generate images & voiceover"}
          </button>
          {project.subtitles && (
            <>
              <a
                href={project.subtitles.srtUrl}
                download
                className="text-sm font-medium underline text-zinc-700 dark:text-zinc-300"
              >
                Download SRT
              </a>
              <a
                href={project.subtitles.vttUrl}
                download
                className="text-sm font-medium underline text-zinc-700 dark:text-zinc-300"
              >
                Download VTT
              </a>
            </>
          )}
          {project.assetsGenerated && (
            <button
              onClick={() => router.push(`/render/${project.id}`)}
              className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Render final video →
            </button>
          )}
        </div>
        {assetsError && <p className="text-sm text-red-600">{assetsError}</p>}

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Scene Breakdown
          </h2>
          {project.scenes.map((scene) => (
            <div
              key={scene.scene}
              className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-black dark:text-zinc-50">
                  Scene {scene.scene}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">
                    {scene.start} – {scene.end}
                  </span>
                  <button
                    onClick={() => handleRegenerateScene(scene.scene)}
                    disabled={regeneratingScene !== null}
                    className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    {regeneratingScene === scene.scene ? "Regenerating..." : "Regenerate"}
                  </button>
                </div>
              </div>

              {(scene.imageUrl || scene.audioUrl) && (
                <div className="mb-3 flex flex-wrap items-start gap-4">
                  {scene.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={scene.imageUrl}
                      alt={`Scene ${scene.scene} visual`}
                      className="h-48 w-auto rounded-md object-cover"
                    />
                  )}
                  {scene.audioUrl && (
                    <audio controls src={scene.audioUrl} className="mt-2">
                      Your browser does not support audio playback.
                    </audio>
                  )}
                </div>
              )}
              {scene.assetError && (
                <p className="mb-2 text-xs text-red-600">{scene.assetError}</p>
              )}

              {editing ? (
                <div className="flex flex-col gap-3 text-sm">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-500">Voiceover</label>
                    <textarea
                      className={textareaClass}
                      value={scene.voiceover}
                      onChange={(e) => updateScene(scene.scene, "voiceover", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-500">Image prompt</label>
                    <textarea
                      className={textareaClass}
                      value={scene.imagePrompt}
                      onChange={(e) => updateScene(scene.scene, "imagePrompt", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-500">Subtitle</label>
                    <input
                      className={textareaClass}
                      value={scene.subtitle}
                      onChange={(e) => updateScene(scene.scene, "subtitle", e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">Voiceover</dt>
                    <dd className="text-zinc-800 dark:text-zinc-200">{scene.voiceover}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">Visual</dt>
                    <dd className="text-zinc-800 dark:text-zinc-200">{scene.visual}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">Image prompt</dt>
                    <dd className="text-zinc-800 dark:text-zinc-200">{scene.imagePrompt}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">Camera movement</dt>
                    <dd className="text-zinc-800 dark:text-zinc-200">{scene.cameraMovement}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">Subtitle</dt>
                    <dd className="text-zinc-800 dark:text-zinc-200">{scene.subtitle}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">Sound effect</dt>
                    <dd className="text-zinc-800 dark:text-zinc-200">{scene.soundEffect}</dd>
                  </div>
                </dl>
              )}
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Music &amp; Export
          </h2>
          <p className="text-zinc-800 dark:text-zinc-200">
            Music: {project.music.style} (volume: {project.music.volume})
          </p>
          <p className="text-zinc-800 dark:text-zinc-200">
            Export: {project.export.format.toUpperCase()} · {project.export.resolution} ·{" "}
            {project.export.fps}fps
          </p>
        </section>

        <Link
          href="/create"
          className="self-start text-sm font-medium underline text-zinc-700 dark:text-zinc-300"
        >
          ← Back to create
        </Link>
      </div>
    </div>
  );
}
