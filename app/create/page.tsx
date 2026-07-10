"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GeneratedProject, Language, ProjectSettings } from "@/types/project";
import { LanguageExportRow, LanguageOption, OutputTab, StudioScene, StudioStatus } from "@/types/studio";
import { DEFAULT_CONTENT_INPUT, DEFAULT_SETTINGS, LANGUAGE_OPTIONS } from "@/lib/studio/mockData";
import TopNavigation from "@/components/studio/TopNavigation";
import InputSettingsPanel from "@/components/studio/InputSettingsPanel";
import VideoPreview from "@/components/studio/VideoPreview";
import AIOutputTabs from "@/components/studio/AIOutputTabs";
import SceneTimeline from "@/components/studio/SceneTimeline";

interface StatusEntry {
  status: StudioStatus;
  progress: number;
  error?: string;
}

function saveProject(p: GeneratedProject) {
  localStorage.setItem(`project:${p.id}`, JSON.stringify(p));
}

function toStudioScenes(project: GeneratedProject | undefined): StudioScene[] {
  if (!project) return [];
  return project.scenes.map((s) => ({
    id: s.scene,
    startTime: s.start,
    endTime: s.end,
    title: s.subtitle,
    description: s.visual,
    thumbnail: "🎬",
    imageUrl: s.imageUrl,
    videoClipUrl: s.videoClipUrl,
    mediaType: s.mediaType,
  }));
}

export default function CreatePage() {
  const router = useRouter();
  const [content, setContent] = useState(DEFAULT_CONTENT_INPUT);
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined);
  const [settings, setSettings] = useState<ProjectSettings>(DEFAULT_SETTINGS);
  const [aspectRatio, setAspectRatio] = useState("9:16 Shorts");
  const [languages, setLanguages] = useState<LanguageOption[]>(LANGUAGE_OPTIONS);
  const [keepSameVoice, setKeepSameVoice] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OutputTab>("AI Plan");
  const [projects, setProjects] = useState<GeneratedProject[]>([]);
  const [statusById, setStatusById] = useState<Record<string, StatusEntry>>({});
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());
  const [downloadingZip, setDownloadingZip] = useState(false);

  function updateSetting<K extends keyof ProjectSettings>(key: K, value: ProjectSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function toggleLanguage(code: Language) {
    setLanguages((prev) => prev.map((l) => (l.code === code ? { ...l, selected: !l.selected } : l)));
  }

  function updateProjectInState(updated: GeneratedProject) {
    saveProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  function setStatus(id: string, entry: StatusEntry) {
    setStatusById((prev) => ({ ...prev, [id]: entry }));
  }

  async function renderProjectById(project: GeneratedProject) {
    setStatus(project.id, { status: "rendering", progress: 60 });
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
      updateProjectInState(updated);
      setStatus(project.id, { status: "completed", progress: 100 });
    } catch (err) {
      setStatus(project.id, {
        status: "failed",
        progress: 0,
        error: err instanceof Error ? err.message : "Render failed.",
      });
    }
  }

  async function handleGenerate() {
    setError(null);
    if (!content.trim()) {
      setError("Please enter some content to generate a video.");
      return;
    }
    const selected = languages.filter((l) => l.selected).map((l) => l.code);
    if (selected.length === 0) {
      setError("Select at least one language.");
      return;
    }

    setGenerating(true);
    setProjects([]);
    setStatusById({});
    setClearedIds(new Set());

    try {
      const res = await fetch("/api/generate/multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content, imageDataUrl, settings, languages: selected }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Script generation failed.");
      }
      const { projects: generated } = (await res.json()) as { projects: GeneratedProject[] };
      generated.forEach(saveProject);
      setProjects(generated);
      generated.forEach((p) => setStatus(p.id, { status: "generating-voice", progress: 20 }));

      const [base, ...siblings] = generated;

      setStatus(base.id, { status: "generating-voice", progress: 40 });
      const propagateRes = await fetch("/api/assets/propagate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseProject: base, siblingProjects: siblings }),
      });
      if (!propagateRes.ok) {
        const data = await propagateRes.json();
        throw new Error(data.error ?? "Asset generation failed.");
      }
      const { base: updatedBase, siblings: updatedSiblings } = (await propagateRes.json()) as {
        base: GeneratedProject;
        siblings: GeneratedProject[];
      };

      const allUpdated = [updatedBase, ...updatedSiblings];
      allUpdated.forEach(updateProjectInState);

      for (const p of allUpdated) {
        const hasSceneError = p.scenes.some((s) => s.assetError);
        const scenesReady = p.scenes.every((s) => s.audioUrl && (s.imageUrl || s.videoClipUrl));
        if (hasSceneError || !scenesReady) {
          setStatus(p.id, {
            status: "failed",
            progress: 0,
            error: p.scenes.find((s) => s.assetError)?.assetError ?? "Missing image or voiceover.",
          });
        } else {
          await renderProjectById(p);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleRetry(projectId: string) {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const base = projects.find((p) => p.assetsGenerated) ?? projects[0];

    setStatus(projectId, { status: "translating", progress: 10 });
    try {
      const res = await fetch("/api/generate/retry-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseProject: base, language: project.language, existingId: projectId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Retry failed.");
      }
      const updated = (await res.json()) as GeneratedProject;
      updateProjectInState(updated);
      await renderProjectById(updated);
    } catch (err) {
      setStatus(projectId, {
        status: "failed",
        progress: 0,
        error: err instanceof Error ? err.message : "Retry failed.",
      });
    }
  }

  async function handleDownloadAll() {
    const completed = projects.filter((p) => statusById[p.id]?.status === "completed" && p.videoUrl);
    if (completed.length === 0) return;
    setDownloadingZip(true);
    try {
      const res = await fetch("/api/projects/zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projects: completed.map((p) => ({ id: p.id, language: p.language })),
        }),
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
      setDownloadingZip(false);
    }
  }

  function handleClearCompleted() {
    setClearedIds((prev) => {
      const next = new Set(prev);
      projects.forEach((p) => {
        if (statusById[p.id]?.status === "completed") next.add(p.id);
      });
      return next;
    });
  }

  const primaryProject = projects[0];
  const studioScenes = toStudioScenes(primaryProject);
  const audioUrls = primaryProject?.scenes.map((s) => s.audioUrl) ?? [];

  const exportRows: LanguageExportRow[] = projects
    .filter((p) => !clearedIds.has(p.id))
    .map((p) => {
      const entry = statusById[p.id] ?? { status: "queued" as StudioStatus, progress: 0 };
      const langOption = languages.find((l) => l.code === p.language);
      return {
        projectId: p.id,
        languageCode: p.language,
        languageName: p.language,
        nativeName: langOption?.nativeName ?? p.language,
        flag: langOption?.flag ?? "🌐",
        voiceName: settings.voice,
        status: entry.status,
        progress: entry.progress,
        previewUrl: p.videoUrl,
        downloadUrl: p.videoUrl,
        errorMessage: entry.error,
      };
    });

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      <TopNavigation activeStep={primaryProject ? 1 : 0} />

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-[30%_30%_40%]">
        <InputSettingsPanel
          content={content}
          onContentChange={setContent}
          onImageChange={setImageDataUrl}
          settings={settings}
          onSettingsChange={updateSetting}
          aspectRatio={aspectRatio}
          onAspectRatioChange={setAspectRatio}
          languages={languages}
          onToggleLanguage={toggleLanguage}
          onSelectAllLanguages={() => setLanguages((prev) => prev.map((l) => ({ ...l, selected: true })))}
          onClearAllLanguages={() => setLanguages((prev) => prev.map((l) => ({ ...l, selected: false })))}
          keepSameVoice={keepSameVoice}
          onKeepSameVoiceChange={setKeepSameVoice}
          onGenerate={handleGenerate}
          generating={generating}
          error={error}
        />

        <VideoPreview
          title={primaryProject?.title}
          subtitle={studioScenes[0]?.title}
          imageUrl={studioScenes[0]?.imageUrl}
          videoUrl={primaryProject?.videoUrl}
          duration={primaryProject?.duration}
        />

        <AIOutputTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          script={primaryProject?.script ?? ""}
          language={primaryProject?.language ?? settings.language}
          duration={primaryProject?.duration ?? settings.duration}
          scenes={studioScenes}
          audioUrls={audioUrls}
          subtitles={primaryProject?.subtitles}
          exports={exportRows}
          onRetry={handleRetry}
          onDownloadAll={handleDownloadAll}
          onClearCompleted={handleClearCompleted}
          downloadingZip={downloadingZip}
        />
      </div>

      <SceneTimeline
        scenes={studioScenes}
        totalDuration={primaryProject?.duration ?? settings.duration}
        onNextStep={() => {
          if (primaryProject) {
            router.push(`/preview/${primaryProject.id}`);
          }
        }}
        nextDisabled={!primaryProject}
      />
    </div>
  );
}
