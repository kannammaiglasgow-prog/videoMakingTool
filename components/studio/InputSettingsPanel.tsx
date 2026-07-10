"use client";

import { Sparkles } from "lucide-react";
import { LanguageOption, VideoSettingsState } from "@/types/studio";
import ContentInput from "@/components/studio/ContentInput";
import VideoSettings from "@/components/studio/VideoSettings";
import MultiLanguageSelector from "@/components/studio/MultiLanguageSelector";
import PrimaryButton from "@/components/studio/ui/PrimaryButton";

interface InputSettingsPanelProps {
  content: string;
  onContentChange: (value: string) => void;
  settings: VideoSettingsState;
  onSettingsChange: <K extends keyof VideoSettingsState>(key: K, value: VideoSettingsState[K]) => void;
  languages: LanguageOption[];
  onToggleLanguage: (code: string) => void;
  onSelectAllLanguages: () => void;
  onClearAllLanguages: () => void;
  keepSameVoice: boolean;
  onKeepSameVoiceChange: (value: boolean) => void;
  onGenerate: () => void;
  generating: boolean;
}

export default function InputSettingsPanel(props: InputSettingsPanelProps) {
  const {
    content,
    onContentChange,
    settings,
    onSettingsChange,
    languages,
    onToggleLanguage,
    onSelectAllLanguages,
    onClearAllLanguages,
    keepSameVoice,
    onKeepSameVoiceChange,
    onGenerate,
    generating,
  } = props;

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-xs font-bold tracking-wider text-purple-400">INPUT & SETTINGS</p>

      <ContentInput value={content} onChange={onContentChange} />
      <VideoSettings settings={settings} onChange={onSettingsChange} />
      <MultiLanguageSelector
        languages={languages}
        onToggle={onToggleLanguage}
        onSelectAll={onSelectAllLanguages}
        onClearAll={onClearAllLanguages}
        keepSameVoice={keepSameVoice}
        onKeepSameVoiceChange={onKeepSameVoiceChange}
      />

      <PrimaryButton onClick={onGenerate} loading={generating} className="w-full py-3.5 text-base">
        {!generating && <Sparkles className="h-4 w-4" />}
        {generating ? "Generating..." : "Generate Video"}
      </PrimaryButton>
    </div>
  );
}
