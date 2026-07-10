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

const STEPS = [
  "Input",
  "AI Plan",
  "Assets",
  "Timeline",
  "Voice & Sub",
  "Preview",
  "Render",
  "Rendering",
  "Export",
];

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

function defaultPixabayQuery(imagePrompt: string): string {
  const firstSentence = imagePrompt.split(".")[0] ?? imagePrompt;
  return firstSentence.trim().split(/\s+/).slice(0, 10).join(" ");
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

  // Wizard Flow States
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [scriptApproved, setScriptApproved] = useState(false);
  const [approvedScenes, setApprovedScenes] = useState<Record<number, boolean>>({});
  const [timelineApproved, setTimelineApproved] = useState(false);
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [editedScriptText, setEditedScriptText] = useState("");
  const [activeScene, setActiveScene] = useState(1);
  const [voiceGenerated, setVoiceGenerated] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatusMessage, setRenderStatusMessage] = useState("");

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
    setApprovedScenes({});
    setScriptApproved(false);
    setTimelineApproved(false);
    setVoiceGenerated(false);

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
      
      // Auto advance to Step 2
      setCurrentStep(2);
      setActiveTab("AI Plan");
      setEditedScriptText(generated[0]?.script ?? "");

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
      setVoiceGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleStockVideoSearchLocal(sceneNumber: number, queryText: string, provider: "pexels" | "pixabay") {
    if (projects.length === 0) return;
    const project = projects[0];
    const query = defaultPixabayQuery(queryText);
    setError(null);
    try {
      const endpoint = provider === "pixabay" ? "/api/assets/pixabay-video" : "/api/assets/pexels-video";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, sceneNumber, query }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Stock video search failed.");
      }
      const { videoClipUrl, credit } = await res.json();
      
      const scenes = project.scenes.map((s) =>
        s.scene === sceneNumber
          ? {
              ...s,
              mediaType: "video" as const,
              videoClipUrl: `${videoClipUrl}?t=${Date.now()}`,
              videoClipCredit: credit,
              assetError: undefined,
            }
          : s
      );
      
      const updated = { ...project, scenes, assetsGenerated: true };
      updateProjectInState(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleUploadImageLocal(sceneNumber: number, file: File) {
    if (projects.length === 0) return;
    const project = projects[0];
    setError(null);
    try {
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/assets/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, sceneNumber, imageDataUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Image upload failed.");
      }
      const { imageUrl } = await res.json();
      
      const scenes = project.scenes.map((s) =>
        s.scene === sceneNumber
          ? { ...s, imageUrl: `${imageUrl}?t=${Date.now()}`, assetError: undefined }
          : s
      );
      
      const updated = { ...project, scenes, assetsGenerated: true };
      updateProjectInState(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleGenerateVoiceoverLocal(sceneNumber: number) {
    if (projects.length === 0) return;
    const project = projects[0];
    setError(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, sceneNumbers: [sceneNumber] }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Voiceover generation failed.");
      }
      const updated = await res.json();
      updateProjectInState(updated);
      
      // Update sibling projects if any
      if (updated.siblings && updated.siblings.length > 0) {
        const siblingProjects = updated.siblings
          .map((s: { id: string }) => {
            const raw = localStorage.getItem(`project:${s.id}`);
            return raw ? (JSON.parse(raw) as GeneratedProject) : null;
          })
          .filter((p: GeneratedProject | null): p is GeneratedProject => p !== null);

        const propagateRes = await fetch("/api/assets/propagate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ baseProject: updated, siblingProjects }),
        });
        if (propagateRes.ok) {
          const { base: updatedBase, siblings: updatedSiblings } = await propagateRes.json();
          updateProjectInState(updatedBase);
          updatedSiblings.forEach((sibling: GeneratedProject) => {
            saveProject(sibling);
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateAllVideos() {
    if (projects.length === 0) return;
    setGenerating(true);
    setError(null);
    const project = projects[0];
    let current = project;
    try {
      for (const scene of current.scenes) {
        const query = defaultPixabayQuery(scene.visual);
        if (!query) continue;
        const res = await fetch("/api/assets/pexels-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: current.id, sceneNumber: scene.scene, query }),
        });
        if (res.ok) {
          const { videoClipUrl, credit } = await res.json();
          const scenes = current.scenes.map((s) =>
            s.scene === scene.scene
              ? {
                  ...s,
                  mediaType: "video" as const,
                  videoClipUrl: `${videoClipUrl}?t=${Date.now()}`,
                  videoClipCredit: credit,
                  assetError: undefined,
                }
              : s
          );
          current = { ...current, scenes, assetsGenerated: true };
          updateProjectInState(current);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch search failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleStartRender() {
    if (projects.length === 0) return;
    const project = projects[0];
    setStatus(project.id, { status: "rendering", progress: 10 });
    setRenderProgress(10);
    setRenderStatusMessage("Initializing FFmpeg pipeline...");
    try {
      setRenderStatusMessage("Synthesizing background music track...");
      setRenderProgress(30);
      
      setRenderStatusMessage("Encoding video scenes and mixing audio...");
      setRenderProgress(60);
      
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
      
      setRenderStatusMessage("Finalizing compilation...");
      setRenderProgress(90);
      
      const updated = { ...project, videoUrl: data.videoUrl };
      updateProjectInState(updated);
      setStatus(project.id, { status: "completed", progress: 100 });
      setRenderProgress(100);
      setRenderStatusMessage("Render completed successfully!");
      setTimeout(() => {
        setCurrentStep(9);
      }, 1000);
    } catch (err) {
      setStatus(project.id, {
        status: "failed",
        progress: 0,
        error: err instanceof Error ? err.message : "Render failed.",
      });
      setRenderStatusMessage(err instanceof Error ? err.message : "Render failed.");
      setError(err instanceof Error ? err.message : "Render failed.");
      setCurrentStep(7);
    }
  }

  // Timeline Adjusters
  function handleDeleteScene(sceneNumber: number) {
    if (projects.length === 0) return;
    const project = projects[0];
    const scenes = project.scenes.filter((s) => s.scene !== sceneNumber)
      .map((s, idx) => ({ ...s, scene: idx + 1 }));
    updateProjectInState({ ...project, scenes });
  }

  function handleDuplicateScene(sceneNumber: number) {
    if (projects.length === 0) return;
    const project = projects[0];
    const original = project.scenes.find((s) => s.scene === sceneNumber);
    if (!original) return;
    const scenes = [...project.scenes];
    const index = scenes.findIndex((s) => s.scene === sceneNumber);
    const copy = { ...original, scene: scenes.length + 1 };
    scenes.splice(index + 1, 0, copy);
    const renumbered = scenes.map((s, idx) => ({ ...s, scene: idx + 1 }));
    updateProjectInState({ ...project, scenes: renumbered });
  }

  function handleMoveScene(sceneNumber: number, direction: "up" | "down") {
    if (projects.length === 0) return;
    const project = projects[0];
    const scenes = [...project.scenes];
    const index = scenes.findIndex((s) => s.scene === sceneNumber);
    if (direction === "up" && index > 0) {
      const temp = scenes[index];
      scenes[index] = scenes[index - 1];
      scenes[index - 1] = temp;
    } else if (direction === "down" && index < scenes.length - 1) {
      const temp = scenes[index];
      scenes[index] = scenes[index + 1];
      scenes[index + 1] = temp;
    }
    const renumbered = scenes.map((s, idx) => ({ ...s, scene: idx + 1 }));
    updateProjectInState({ ...project, scenes: renumbered });
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
  const allAudioReady = primaryProject && primaryProject.scenes.every((s) => s.audioUrl);

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
      <TopNavigation activeStep={currentStep - 1} />

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-[30%_30%_40%]">
        {/* Left Column: Panel Setup or Read-only view */}
        {currentStep === 1 ? (
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
        ) : (
          <div className="flex h-full flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm">
            <p className="text-xs font-bold tracking-wider text-purple-400">PROJECT CONFIGURATION</p>
            <div className="flex flex-col gap-3 text-slate-300">
              <p><strong>Duration:</strong> {primaryProject?.duration ?? settings.duration}s</p>
              <p><strong>Tone:</strong> {primaryProject?.tone ?? settings.tone}</p>
              <p><strong>Visual Style:</strong> {primaryProject?.style ?? settings.style}</p>
              <p><strong>Voice Style:</strong> {primaryProject?.voice ?? settings.voice}</p>
              <p><strong>Music:</strong> {settings.music}</p>
              <p><strong>Platform:</strong> {settings.platform}</p>
              
              <div className="mt-2 border-t border-slate-800 pt-3">
                <p className="font-semibold text-slate-200">Selected Languages:</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {projects.map((p) => (
                    <span key={p.id} className="rounded-full bg-purple-900/40 border border-purple-800 px-2 py-0.5 text-xs text-purple-300">
                      {p.language}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => {
                setCurrentStep(1);
                setScriptApproved(false);
              }}
              className="mt-auto w-full py-2.5 text-xs font-medium text-purple-400 hover:text-purple-300 border border-purple-800/40 rounded-lg hover:bg-purple-950/20 transition-colors"
            >
              Modify Configuration
            </button>
          </div>
        )}

        {/* Middle Column: Video Preview & Subtitle Preview */}
        <VideoPreview
          title={primaryProject?.title}
          subtitle={studioScenes[activeScene - 1]?.title}
          imageUrl={studioScenes[activeScene - 1]?.imageUrl}
          videoUrl={primaryProject?.videoUrl}
          duration={primaryProject?.duration}
        />

        {/* Right Column: Step-specific view */}
        {currentStep === 1 && (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-center text-slate-500">
            <p className="text-sm">Configure parameters on the left and click <strong>Generate Video</strong> to start.</p>
          </div>
        )}

        {currentStep === 2 && (
          <div className="flex h-full flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 overflow-y-auto">
            <p className="text-xs font-bold tracking-wider text-purple-400">STEP 2: APPROVE AI PLAN</p>
            
            {isEditingScript ? (
              <div className="flex flex-1 flex-col gap-3">
                <textarea
                  value={editedScriptText}
                  onChange={(e) => setEditedScriptText(e.target.value)}
                  className="flex-1 w-full p-3 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 text-sm font-mono focus:outline-none focus:border-purple-500 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (primaryProject) {
                        updateProjectInState({ ...primaryProject, script: editedScriptText });
                      }
                      setIsEditingScript(false);
                    }}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 font-semibold rounded text-xs transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditedScriptText(primaryProject?.script ?? "");
                      setIsEditingScript(false);
                    }}
                    className="flex-1 py-2 border border-slate-750 hover:bg-slate-800 font-semibold rounded text-xs transition-colors text-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col gap-3">
                <div className="flex-1 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-sm leading-relaxed text-slate-200 font-medium">
                  {primaryProject?.script}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditingScript(true)}
                    className="flex-1 py-2.5 border border-slate-700 hover:bg-slate-850 font-semibold rounded-lg text-xs transition-colors text-slate-200"
                  >
                    Edit Script
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex-1 py-2.5 border border-slate-700 hover:bg-slate-850 font-semibold rounded-lg text-xs transition-colors text-slate-200 disabled:opacity-50"
                  >
                    Regenerate Script
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="flex h-full flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold tracking-wider text-purple-400">STEP 3: ASSET MANAGER</p>
              <button
                onClick={handleGenerateAllVideos}
                disabled={generating}
                className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold hover:bg-purple-500 disabled:opacity-50 transition-colors"
              >
                {generating ? "Generating..." : "Auto-Search All Videos"}
              </button>
            </div>
            
            <p className="text-xs text-slate-400 leading-normal">
              Find stock video clips or upload custom images for each scene. We will auto-fallback to a blank template if not set.
            </p>

            <div className="flex flex-col gap-3 mt-1">
              {studioScenes.map((scene) => {
                const isApproved = approvedScenes[scene.id];
                const hasVideo = scene.mediaType === "video" && scene.videoClipUrl;
                const hasImage = !hasVideo && !!scene.imageUrl;
                
                return (
                  <div
                    key={scene.id}
                    onClick={() => setActiveScene(scene.id)}
                    className={"rounded-xl border p-3 flex flex-col gap-2.5 transition-all cursor-pointer " + 
                      (scene.id === activeScene ? "ring-2 ring-purple-500 " : "") +
                      (isApproved ? "border-emerald-800 bg-emerald-950/10" : "border-slate-800 bg-slate-950/40")}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-purple-300">Scene {scene.id}</span>
                        <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">{scene.title}</p>
                      </div>
                      <span className={"text-[10px] px-2 py-0.5 rounded-full font-bold " + (isApproved ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400")}>
                        {isApproved ? "Approved" : "Pending"}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      {/* Visual Thumbnail */}
                      <div className="w-16 h-24 bg-slate-950 rounded border border-slate-850 flex items-center justify-center overflow-hidden text-2xl flex-shrink-0">
                        {hasVideo ? (
                          <video src={scene.videoClipUrl} muted className="w-full h-full object-cover" />
                        ) : hasImage ? (
                          <img src={scene.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          "🎬"
                        )}
                      </div>

                      <div className="flex-1 flex flex-col gap-2 justify-center">
                        <div className="flex flex-wrap gap-1 text-[9px] text-slate-400 font-semibold">
                          <span className={"px-1.5 py-0.5 rounded " + (hasVideo ? "bg-purple-950/60 text-purple-300 border border-purple-900" : "bg-slate-900 text-slate-500")}>
                            Video: {hasVideo ? "Ready" : "None"}
                          </span>
                          <span className={"px-1.5 py-0.5 rounded " + (hasImage ? "bg-purple-950/60 text-purple-300 border border-purple-900" : "bg-slate-900 text-slate-500")}>
                            Image: {hasImage ? "Uploaded" : "None"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStockVideoSearchLocal(scene.id, scene.description, "pexels");
                            }}
                            className="py-1 text-[11px] font-bold text-center border border-slate-700 rounded hover:bg-slate-800 transition-colors"
                          >
                            Find Video
                          </button>
                          <label className="py-1 text-[11px] font-bold text-center border border-slate-700 rounded hover:bg-slate-800 transition-colors cursor-pointer">
                            Upload
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadImageLocal(scene.id, file);
                              }}
                            />
                          </label>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setApprovedScenes(prev => ({ ...prev, [scene.id]: !prev[scene.id] }));
                          }}
                          className={"py-1 text-[11px] font-bold rounded transition-colors " + (isApproved ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "border border-emerald-800/40 text-emerald-400 hover:bg-emerald-950/20")}
                        >
                          {isApproved ? "Approve ✓" : "Mark Approved"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="flex h-full flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 overflow-y-auto">
            <p className="text-xs font-bold tracking-wider text-purple-400">STEP 4: TIMELINE EDITING</p>
            <p className="text-xs text-slate-400 leading-normal">
              Adjust sequence order, copy key scenes or delete portions of your video setup.
            </p>

            <div className="flex flex-col gap-2 mt-2">
              {studioScenes.map((scene, idx) => (
                <div
                  key={scene.id}
                  onClick={() => setActiveScene(scene.id)}
                  className={"rounded-xl border p-3 flex items-center justify-between gap-3 transition-colors cursor-pointer " +
                    (scene.id === activeScene ? "border-purple-500 bg-slate-950/60" : "border-slate-850 bg-slate-950/30")}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 font-bold text-white text-[10px]">
                      {scene.id}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-200 line-clamp-1">{scene.title}</span>
                      <span className="text-[10px] text-slate-400">{scene.startTime} – {scene.endTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      disabled={idx === 0}
                      onClick={(e) => { e.stopPropagation(); handleMoveScene(scene.id, "up"); }}
                      className="p-1 border border-slate-800 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-[10px]"
                    >
                      ▲
                    </button>
                    <button
                      disabled={idx === studioScenes.length - 1}
                      onClick={(e) => { e.stopPropagation(); handleMoveScene(scene.id, "down"); }}
                      className="p-1 border border-slate-800 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-[10px]"
                    >
                      ▼
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDuplicateScene(scene.id); }}
                      className="px-1.5 py-1 border border-slate-800 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold"
                    >
                      Copy
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteScene(scene.id); }}
                      className="px-1.5 py-1 border border-red-900/50 rounded bg-red-950/20 text-red-400 hover:bg-red-900/30 text-[10px] font-semibold"
                    >
                      Del
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="flex h-full flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 overflow-y-auto">
            <p className="text-xs font-bold tracking-wider text-purple-400">STEP 5: VOICE & SUBTITLES</p>
            <p className="text-xs text-slate-400 leading-normal">
              Ensure scene voiceovers are generated and preview timings.
            </p>

            <button
              onClick={async () => {
                if (projects.length === 0) return;
                setGenerating(true);
                setError(null);
                try {
                  const base = projects[0];
                  const res = await fetch("/api/assets", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ project: base }),
                  });
                  if (!res.ok) throw new Error("Audio generation failed");
                  const updatedBase = await res.json();
                  updateProjectInState(updatedBase);
                  setVoiceGenerated(true);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Error generating audio");
                } finally {
                  setGenerating(false);
                }
              }}
              disabled={generating}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 font-bold rounded-lg text-xs disabled:opacity-50 transition-colors"
            >
              {generating ? "Generating Voiceovers..." : "Generate / Sync All Voiceovers"}
            </button>

            {error && (
              <div className="mt-2 p-2 rounded border border-red-900/50 bg-red-950/20 text-red-400 text-xs font-semibold leading-normal">
                Error: {error}
              </div>
            )}

            {primaryProject?.subtitles && (
              <div className="flex gap-3 border-y border-slate-800 py-3 mt-1.5">
                <a href={primaryProject.subtitles.srtUrl} download className="text-xs font-bold text-purple-400 hover:underline">
                  Download Subtitles (SRT)
                </a>
                <a href={primaryProject.subtitles.vttUrl} download className="text-xs font-bold text-purple-400 hover:underline">
                  Download Subtitles (VTT)
                </a>
              </div>
            )}

            <div className="flex flex-col gap-2 mt-2">
              {studioScenes.map((scene, idx) => (
                <div key={scene.id} className="rounded-xl border border-slate-850 bg-slate-950/40 p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300">Scene {scene.id} Audio</span>
                    {audioUrls[idx] ? (
                      <div className="flex items-center gap-2">
                        <audio controls src={audioUrls[idx]} className="h-6 max-w-[120px]" />
                        <button
                          onClick={() => handleGenerateVoiceoverLocal(scene.id)}
                          disabled={generating}
                          className="px-2 py-0.5 border border-slate-700 hover:bg-slate-800 rounded text-[9px] font-semibold text-slate-300 disabled:opacity-50"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-amber-500 font-semibold font-semibold">Missing</span>
                        <button
                          onClick={() => handleGenerateVoiceoverLocal(scene.id)}
                          disabled={generating}
                          className="px-2 py-0.5 bg-purple-600 hover:bg-purple-500 rounded text-[9px] font-semibold text-white disabled:opacity-50"
                        >
                          Generate
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 italic">"{scene.title}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="flex h-full flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 overflow-y-auto">
            <p className="text-xs font-bold tracking-wider text-purple-400">STEP 6: PREVIEW PREFERENCES</p>
            <p className="text-xs text-slate-400 leading-normal">
              Toggle specific layers in the workspace preview frame on the left.
            </p>

            <div className="flex flex-col gap-4 border-t border-slate-800 pt-4 text-xs font-medium">
              <div className="flex items-center justify-between">
                <span>Display Subtitles Overlay</span>
                <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-900 text-purple-600 h-4 w-4" />
              </div>
              <div className="flex items-center justify-between">
                <span>Enable Voice Track</span>
                <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-900 text-purple-600 h-4 w-4" />
              </div>
              <div className="flex items-center justify-between">
                <span>Enable Background Music</span>
                <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-900 text-purple-600 h-4 w-4" />
              </div>
              <div className="flex flex-col gap-1.5 pt-2">
                <div className="flex justify-between">
                  <span>Synthesized Music Theme:</span>
                  <span className="font-bold text-purple-400">{settings.music}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 7 && (
          <div className="flex h-full flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 overflow-y-auto">
            <p className="text-xs font-bold tracking-wider text-purple-400">STEP 7: RENDER CHECKLIST</p>
            <p className="text-xs text-slate-400 leading-normal">
              Confirm required components are validated. We use a dynamic deep-purple visual fallback if no custom visuals are uploaded.
            </p>

            <div className="flex flex-col gap-3.5 border-t border-slate-800 pt-4 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">✓</span>
                <span className="text-slate-200">Script Approved</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className={"flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold " + (allAudioReady ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500")}>
                  {allAudioReady ? "✓" : "!"}
                </span>
                <span className="text-slate-200">Voiceover Tracks Generated</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">✓</span>
                <span className="text-slate-200">Visuals Configured (Color Fallbacks Enabled)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className={"flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold " + (primaryProject?.subtitles ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500")}>
                  {primaryProject?.subtitles ? "✓" : "!"}
                </span>
                <span className="text-slate-200">Subtitles Timings Synced</span>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg border border-red-900/50 bg-red-950/20 text-red-400 text-xs font-semibold leading-normal">
                Error: {error}
              </div>
            )}

            <button
              onClick={() => {
                setCurrentStep(8);
                handleStartRender();
              }}
              disabled={!allAudioReady || !primaryProject?.subtitles}
              className="w-full mt-auto py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Start Final Render
            </button>
          </div>
        )}

        {currentStep === 8 && (
          <div className="flex h-full flex-col items-center justify-center gap-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-center">
            <p className="text-xs font-bold tracking-wider text-purple-400">STEP 8: RENDER IN PROGRESS</p>
            
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full border-4 border-purple-800/40 border-t-purple-500 animate-spin" />

            <div>
              <p className="text-sm font-bold text-slate-200">Generating video package...</p>
              <p className="text-xs text-slate-400 mt-1.5 leading-normal max-w-xs mx-auto">
                {renderStatusMessage}
              </p>
            </div>

            <div className="w-full bg-slate-950 rounded-full h-2 max-w-xs overflow-hidden border border-slate-800">
              <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${renderProgress}%` }}></div>
            </div>

            <p className="text-xs text-slate-400 font-semibold">{renderProgress}%</p>
          </div>
        )}

        {currentStep === 9 && (
          <div className="flex h-full flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 overflow-y-auto">
            <p className="text-xs font-bold tracking-wider text-purple-400">STEP 9: EXPORT READY</p>
            <p className="text-xs text-slate-400 leading-normal">
              Your vertical video has successfully rendered! Get the direct MP4 or download files package.
            </p>

            <div className="flex flex-col gap-3.5 border-t border-slate-800 pt-4">
              <a
                href={primaryProject?.videoUrl}
                download
                className="w-full py-3 bg-emerald-650 hover:bg-emerald-600 font-bold rounded-xl text-xs text-white text-center transition-colors block"
              >
                Download MP4 Video
              </a>

              <button
                onClick={handleDownloadAll}
                className="w-full py-3 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors"
              >
                Download ZIP Package
              </button>
            </div>

            {projects.length > 1 && (
              <div className="mt-4 border-t border-slate-800 pt-4">
                <p className="text-xs font-bold text-slate-300">Other Languages:</p>
                <div className="mt-2 flex flex-col gap-2">
                  {projects.slice(1).map((proj) => {
                    const projStatus = statusById[proj.id]?.status ?? "queued";
                    const isCompleted = projStatus === "completed" && proj.videoUrl;
                    
                    return (
                      <div key={proj.id} className="flex items-center justify-between text-xs p-2 rounded bg-slate-950/40 border border-slate-800">
                        <span>{proj.language}</span>
                        {isCompleted ? (
                          <a href={proj.videoUrl} download className="text-emerald-400 underline font-medium">Download</a>
                        ) : (
                          <button
                            onClick={() => handleRetry(proj.id)}
                            disabled={projStatus === "rendering" || projStatus === "translating"}
                            className="text-purple-400 underline font-medium disabled:opacity-50"
                          >
                            {projStatus === "rendering" ? "Rendering..." : projStatus === "translating" ? "Translating..." : "Render now"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setCurrentStep(1);
                setProjects([]);
                setScriptApproved(false);
                setApprovedScenes({});
                setTimelineApproved(false);
                setVoiceGenerated(false);
              }}
              className="w-full mt-auto py-2.5 border border-purple-800/40 text-purple-400 hover:bg-purple-950/20 text-xs font-semibold rounded-xl transition-colors"
            >
              Create Another Video
            </button>
          </div>
        )}
      </div>

      {/* Timeline Bottom view (only visible in timeline editing step) */}
      {currentStep === 4 && (
        <SceneTimeline
          scenes={studioScenes}
          totalDuration={primaryProject?.duration ?? settings.duration}
          onNextStep={() => setCurrentStep(5)}
          nextDisabled={false}
        />
      )}

      {/* Wizard Progress Action Bar */}
      {primaryProject && (
        <div className="flex items-center justify-between border-t border-slate-900 bg-slate-950 px-6 py-4 z-10 flex-shrink-0">
          <div className="text-xs">
            <span className="text-purple-400 font-bold uppercase tracking-wider text-[9px]">Wizard Process</span>
            <p className="text-slate-200 font-semibold text-sm">{currentStep}. {STEPS[currentStep - 1]}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {currentStep > 1 && currentStep !== 8 && currentStep !== 9 && (
              <button
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-4 py-2 border border-slate-750 rounded-lg hover:bg-slate-900 text-xs font-medium transition-colors text-slate-300"
              >
                Back
              </button>
            )}
            
            {currentStep === 2 && (
              <button
                onClick={() => {
                  setScriptApproved(true);
                  setCurrentStep(3);
                }}
                className="px-5 py-2.5 bg-purple-650 hover:bg-purple-600 font-bold rounded-lg text-xs text-white transition-colors"
              >
                Approve Plan & Continue →
              </button>
            )}
            
            {currentStep === 3 && (
              <button
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2.5 bg-purple-650 hover:bg-purple-600 font-bold rounded-lg text-xs text-white transition-colors"
              >
                Approve Assets & Continue →
              </button>
            )}
            
            {currentStep === 4 && (
              <button
                onClick={() => {
                  setTimelineApproved(true);
                  setCurrentStep(5);
                }}
                className="px-5 py-2.5 bg-purple-650 hover:bg-purple-600 font-bold rounded-lg text-xs text-white transition-colors"
              >
                Approve Timeline & Continue →
              </button>
            )}
            
            {currentStep === 5 && (
              <button
                onClick={() => setCurrentStep(6)}
                className="px-5 py-2.5 bg-purple-650 hover:bg-purple-600 font-bold rounded-lg text-xs text-white transition-colors"
              >
                Continue to Preview →
              </button>
            )}
            
            {currentStep === 6 && (
              <button
                onClick={() => setCurrentStep(7)}
                className="px-5 py-2.5 bg-purple-650 hover:bg-purple-600 font-bold rounded-lg text-xs text-white transition-colors"
              >
                Continue to Render →
              </button>
            )}

            {currentStep === 7 && (
              <button
                onClick={() => {
                  setCurrentStep(8);
                  handleStartRender();
                }}
                disabled={!allAudioReady || !primaryProject?.subtitles}
                className="px-5 py-2.5 bg-purple-605 hover:bg-purple-600 disabled:bg-slate-800 disabled:text-slate-500 font-bold rounded-lg text-xs text-white transition-colors"
              >
                Render Video 🎬
              </button>
            )}

            {currentStep === 9 && (
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setProjects([]);
                  setScriptApproved(false);
                  setApprovedScenes({});
                  setTimelineApproved(false);
                  setVoiceGenerated(false);
                }}
                className="px-5 py-2.5 bg-purple-650 hover:bg-purple-600 font-bold rounded-lg text-xs text-white transition-colors"
              >
                Create Another Video ✨
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
