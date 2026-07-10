"use client";

import { LanguageExportRow, OutputTab, StudioScene } from "@/types/studio";
import GeneratedScriptCard from "@/components/studio/GeneratedScriptCard";
import LanguageExportTable from "@/components/studio/LanguageExportTable";

const TABS: OutputTab[] = [
  "AI Plan",
  "Script",
  "Scenes",
  "Images",
  "Voice",
  "Subtitles",
  "Timeline",
];

interface AIOutputTabsProps {
  activeTab: OutputTab;
  onTabChange: (tab: OutputTab) => void;
  script: string;
  language: string;
  duration: number;
  scenes: StudioScene[];
  audioUrls: (string | undefined)[];
  subtitles?: { srtUrl: string; vttUrl: string };
  exports: LanguageExportRow[];
  onRetry: (projectId: string) => void;
  onDownloadAll: () => void;
  onClearCompleted: () => void;
  downloadingZip: boolean;
}

export default function AIOutputTabs(props: AIOutputTabsProps) {
  const {
    activeTab,
    onTabChange,
    script,
    language,
    duration,
    scenes,
    audioUrls,
    subtitles,
    exports,
    onRetry,
    onDownloadAll,
    onClearCompleted,
    downloadingZip,
  } = props;

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={
              "rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors " +
              (activeTab === tab
                ? "bg-purple-600/20 text-purple-300"
                : "text-slate-500 hover:text-slate-300")
            }
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto">
        {activeTab === "AI Plan" && (
          <>
            <GeneratedScriptCard
              script={script || "Generate a video to see the script here."}
              language={language}
              duration={duration}
              sceneCount={scenes.length}
            />
            <LanguageExportTable
              exports={exports}
              onRetry={onRetry}
              onDownloadAll={onDownloadAll}
              onClearCompleted={onClearCompleted}
              downloadingZip={downloadingZip}
            />
          </>
        )}

        {activeTab === "Script" && (
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-100">
            {script || "Generate a video to see the script here."}
          </div>
        )}

        {activeTab === "Scenes" && (
          <div className="flex flex-col gap-3">
            {scenes.length === 0 && (
              <p className="text-sm text-slate-500">No scenes generated yet.</p>
            )}
            {scenes.map((scene) => (
              <div key={scene.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                <p className="text-xs font-semibold text-purple-300">
                  Scene {scene.id} · {scene.startTime} – {scene.endTime}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-100">{scene.title}</p>
                <p className="text-xs text-slate-400">{scene.description}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Images" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {scenes.length === 0 && (
              <p className="col-span-full text-sm text-slate-500">No images generated yet.</p>
            )}
            {scenes.map((scene) => (
              <div key={scene.id} className="flex flex-col gap-1">
                <div className="flex aspect-[9/16] items-center justify-center overflow-hidden rounded-lg bg-slate-800 text-3xl">
                  {scene.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={scene.imageUrl} alt={scene.title} className="h-full w-full object-cover" />
                  ) : (
                    scene.thumbnail
                  )}
                </div>
                <p className="text-[11px] text-slate-500">Scene {scene.id}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Voice" && (
          <div className="flex flex-col gap-3">
            {audioUrls.every((u) => !u) && (
              <p className="text-sm text-slate-500">No voiceover generated yet.</p>
            )}
            {scenes.map((scene, i) => (
              <div key={scene.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                <span className="text-xs font-medium text-slate-300">Scene {scene.id}</span>
                {audioUrls[i] ? (
                  <audio controls src={audioUrls[i]} className="h-8" />
                ) : (
                  <span className="text-[11px] text-slate-600">Not generated</span>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "Subtitles" && (
          <div className="flex flex-col gap-3">
            {!subtitles && <p className="text-sm text-slate-500">No subtitles generated yet.</p>}
            {subtitles && (
              <div className="flex gap-3">
                <a href={subtitles.srtUrl} download className="text-xs font-medium text-purple-400 underline">
                  Download SRT
                </a>
                <a href={subtitles.vttUrl} download className="text-xs font-medium text-purple-400 underline">
                  Download VTT
                </a>
              </div>
            )}
            {scenes.map((scene) => (
              <div key={scene.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300">
                <span className="font-semibold text-purple-300">{scene.startTime}–{scene.endTime}: </span>
                {scene.title}
              </div>
            ))}
          </div>
        )}

        {activeTab === "Timeline" && (
          <div className="flex flex-col gap-2">
            {scenes.map((scene) => (
              <div key={scene.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 font-bold text-white">
                  {scene.id}
                </span>
                <span className="text-slate-400">{scene.startTime} – {scene.endTime}</span>
                <span className="font-medium text-slate-100">{scene.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
