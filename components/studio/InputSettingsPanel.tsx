"use client";

import { Sparkles } from "lucide-react";
import { Language, ProjectSettings } from "@/types/project";
import { LanguageOption } from "@/types/studio";
import ContentInput from "@/components/studio/ContentInput";
import VideoSettings from "@/components/studio/VideoSettings";
import MultiLanguageSelector from "@/components/studio/MultiLanguageSelector";
import PrimaryButton from "@/components/studio/ui/PrimaryButton";

interface InputSettingsPanelProps {
  content: string;
  onContentChange: (value: string) => void;
  onImageChange: (dataUrl: string | undefined) => void;
  settings: ProjectSettings;
  onSettingsChange: <K extends keyof ProjectSettings>(key: K, value: ProjectSettings[K]) => void;
  aspectRatio: string;
  onAspectRatioChange: (value: string) => void;
  languages: LanguageOption[];
  onToggleLanguage: (code: Language) => void;
  onSelectAllLanguages: () => void;
  onClearAllLanguages: () => void;
  keepSameVoice: boolean;
  onKeepSameVoiceChange: (value: boolean) => void;
  onGenerate: () => void;
  generating: boolean;
  error: string | null;
}

export default function InputSettingsPanel(props: InputSettingsPanelProps) {
  const {
    content,
    onContentChange,
    onImageChange,
    settings,
    onSettingsChange,
    aspectRatio,
    onAspectRatioChange,
    languages,
    onToggleLanguage,
    onSelectAllLanguages,
    onClearAllLanguages,
    keepSameVoice,
    onKeepSameVoiceChange,
    onGenerate,
    generating,
    error,
  } = props;

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-xs font-bold tracking-wider text-purple-400">INPUT & SETTINGS</p>

      <ContentInput value={content} onChange={onContentChange} onImageChange={onImageChange} />
      <VideoSettings
        settings={settings}
        aspectRatio={aspectRatio}
        onAspectRatioChange={onAspectRatioChange}
        onChange={onSettingsChange}
      />
      <MultiLanguageSelector
        languages={languages}
        onToggle={onToggleLanguage}
        onSelectAll={onSelectAllLanguages}
        onClearAll={onClearAllLanguages}
        keepSameVoice={keepSameVoice}
        onKeepSameVoiceChange={onKeepSameVoiceChange}
      />

      {error && <p className="text-xs text-red-400">{error}</p>}

      <PrimaryButton onClick={onGenerate} loading={generating} className="w-full py-3.5 text-base">
        {!generating && <Sparkles className="h-4 w-4" />}
        {generating ? "Generating..." : "Generate Video"}
      </PrimaryButton>
    </div>
  );
}
