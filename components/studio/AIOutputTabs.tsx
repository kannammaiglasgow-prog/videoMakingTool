"use client";

import { LanguageExport } from "@/types/studio";
import { OutputTab } from "@/types/studio";
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
  sceneCount: number;
  exports: LanguageExport[];
  onRetry: (languageCode: string) => void;
  onDownloadAll: () => void;
  onClearCompleted: () => void;
}

export default function AIOutputTabs(props: AIOutputTabsProps) {
  const {
    activeTab,
    onTabChange,
    script,
    language,
    duration,
    sceneCount,
    exports,
    onRetry,
    onDownloadAll,
    onClearCompleted,
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
              script={script}
              language={language}
              duration={duration}
              sceneCount={sceneCount}
            />
            <LanguageExportTable
              exports={exports}
              onRetry={onRetry}
              onDownloadAll={onDownloadAll}
              onClearCompleted={onClearCompleted}
            />
          </>
        )}

        {activeTab !== "AI Plan" && (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
            {activeTab} tab — mock content coming soon.
          </div>
        )}
      </div>
    </div>
  );
}
