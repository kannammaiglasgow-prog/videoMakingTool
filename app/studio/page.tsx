"use client";

import { useState } from "react";
import { LanguageExport, LanguageOption, OutputTab, VideoSettingsState } from "@/types/studio";
import {
  DEFAULT_VIDEO_SETTINGS,
  LANGUAGE_OPTIONS,
  MOCK_CONTENT_INPUT,
  MOCK_LANGUAGE_EXPORTS,
  MOCK_SCENES,
  MOCK_SCRIPT_TAMIL,
} from "@/lib/studio/mockData";
import TopNavigation from "@/components/studio/TopNavigation";
import InputSettingsPanel from "@/components/studio/InputSettingsPanel";
import VideoPreview from "@/components/studio/VideoPreview";
import AIOutputTabs from "@/components/studio/AIOutputTabs";
import SceneTimeline from "@/components/studio/SceneTimeline";

export default function StudioPage() {
  const [content, setContent] = useState(MOCK_CONTENT_INPUT);
  const [settings, setSettings] = useState<VideoSettingsState>(DEFAULT_VIDEO_SETTINGS);
  const [languages, setLanguages] = useState<LanguageOption[]>(LANGUAGE_OPTIONS);
  const [keepSameVoice, setKeepSameVoice] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<OutputTab>("AI Plan");
  const [exports, setExports] = useState<LanguageExport[]>(MOCK_LANGUAGE_EXPORTS);

  function updateSetting<K extends keyof VideoSettingsState>(key: K, value: VideoSettingsState[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function toggleLanguage(code: string) {
    setLanguages((prev) =>
      prev.map((l) => (l.code === code ? { ...l, selected: !l.selected } : l))
    );
  }

  function selectAllLanguages() {
    setLanguages((prev) => prev.map((l) => ({ ...l, selected: true })));
  }

  function clearAllLanguages() {
    setLanguages((prev) => prev.map((l) => ({ ...l, selected: false })));
  }

  function handleGenerate() {
    setGenerating(true);
    // Mock generation delay — no real API call.
    setTimeout(() => setGenerating(false), 1800);
  }

  function handleRetry(languageCode: string) {
    setExports((prev) =>
      prev.map((e) =>
        e.languageCode === languageCode ? { ...e, status: "rendering", progress: 10 } : e
      )
    );
  }

  function handleDownloadAll() {
    // Mock only — no real download in this UI-only prototype.
  }

  function handleClearCompleted() {
    setExports((prev) => prev.filter((e) => e.status !== "completed"));
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      <TopNavigation activeStep={0} />

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-[30%_30%_40%]">
        <InputSettingsPanel
          content={content}
          onContentChange={setContent}
          settings={settings}
          onSettingsChange={updateSetting}
          languages={languages}
          onToggleLanguage={toggleLanguage}
          onSelectAllLanguages={selectAllLanguages}
          onClearAllLanguages={clearAllLanguages}
          keepSameVoice={keepSameVoice}
          onKeepSameVoiceChange={setKeepSameVoice}
          onGenerate={handleGenerate}
          generating={generating}
        />

        <VideoPreview />

        <AIOutputTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          script={MOCK_SCRIPT_TAMIL}
          language={settings.language}
          duration={30}
          sceneCount={MOCK_SCENES.length}
          exports={exports}
          onRetry={handleRetry}
          onDownloadAll={handleDownloadAll}
          onClearCompleted={handleClearCompleted}
        />
      </div>

      <SceneTimeline scenes={MOCK_SCENES} totalDuration={30} />
    </div>
  );
}
