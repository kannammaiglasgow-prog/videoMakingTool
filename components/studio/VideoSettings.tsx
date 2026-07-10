"use client";

import {
  Audience,
  Language,
  MusicStyle,
  Platform,
  ProjectSettings,
  Style,
  Tone,
  VideoLength,
  VisualStyle,
  Voice,
} from "@/types/project";
import SelectField from "@/components/studio/ui/SelectField";

const DURATION_OPTIONS: VideoLength[] = [15, 30, 45, 60, 120, 300, 480, 600];

function formatDuration(seconds: VideoLength): string {
  if (seconds < 60) return `${seconds} Seconds`;
  return `${seconds / 60} Minutes`;
}

function parseDuration(label: string): VideoLength {
  const match = DURATION_OPTIONS.find((d) => formatDuration(d) === label);
  return match ?? 30;
}

const OPTIONS = {
  aspectRatio: ["9:16 Shorts", "1:1 Square", "16:9 Landscape"],
  language: [
    "Tamil",
    "English",
    "Hindi",
    "Malayalam",
    "Telugu",
    "Kannada",
    "Arabic",
    "French",
    "German",
    "Spanish",
  ] as Language[],
  platform: ["YouTube Shorts", "Instagram Reels", "TikTok", "Facebook Reels"] as Platform[],
  targetAudience: [
    "General Public",
    "Students",
    "Parents",
    "Professionals",
    "Kids",
    "Social Media Audience",
  ] as Audience[],
  tone: [
    "Neutral",
    "Supportive",
    "Opposing",
    "Serious",
    "Exciting",
    "Funny",
    "Emotional",
    "Documentary",
  ] as Tone[],
  videoStyle: [
    "Breaking News",
    "Storytelling",
    "Documentary",
    "Comedy",
    "Educational",
    "Cinematic",
    "Social Commentary",
  ] as Style[],
  voiceStyle: [
    "Male News Reader",
    "Female News Reader",
    "Male Narrator",
    "Female Narrator",
    "Calm Voice",
    "Energetic Voice",
  ] as Voice[],
  musicStyle: [
    "Auto",
    "No Music",
    "Suspense",
    "Epic",
    "News",
    "Emotional",
    "Funny",
    "Cinematic",
  ] as MusicStyle[],
  visualStyle: ["Realistic", "Cinematic", "Documentary", "AI Art", "3D", "Cartoon"] as VisualStyle[],
};

interface VideoSettingsProps {
  settings: ProjectSettings;
  aspectRatio: string;
  onAspectRatioChange: (value: string) => void;
  onChange: <K extends keyof ProjectSettings>(key: K, value: ProjectSettings[K]) => void;
}

export default function VideoSettings({
  settings,
  aspectRatio,
  onAspectRatioChange,
  onChange,
}: VideoSettingsProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold tracking-wide text-slate-400">2. VIDEO SETTINGS</p>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Video Length"
          value={formatDuration(settings.duration)}
          options={DURATION_OPTIONS.map(formatDuration)}
          onChange={(v) => onChange("duration", parseDuration(v))}
        />
        <SelectField
          label="Language (Default)"
          value={settings.language}
          options={OPTIONS.language}
          onChange={(v) => onChange("language", v as Language)}
        />
        <SelectField
          label="Aspect Ratio"
          value={aspectRatio}
          options={OPTIONS.aspectRatio}
          onChange={onAspectRatioChange}
        />
        <SelectField
          label="Platform"
          value={settings.platform}
          options={OPTIONS.platform}
          onChange={(v) => onChange("platform", v as Platform)}
        />
        <SelectField
          label="Target Audience"
          value={settings.audience}
          options={OPTIONS.targetAudience}
          onChange={(v) => onChange("audience", v as Audience)}
        />
        <SelectField
          label="Tone"
          value={settings.tone}
          options={OPTIONS.tone}
          onChange={(v) => onChange("tone", v as Tone)}
        />
        <SelectField
          label="Video Style"
          value={settings.style}
          options={OPTIONS.videoStyle}
          onChange={(v) => onChange("style", v as Style)}
        />
        <SelectField
          label="Voice Style"
          value={settings.voice}
          options={OPTIONS.voiceStyle}
          onChange={(v) => onChange("voice", v as Voice)}
        />
        <SelectField
          label="Music Style"
          value={settings.music}
          options={OPTIONS.musicStyle}
          onChange={(v) => onChange("music", v as MusicStyle)}
        />
        <SelectField
          label="Visual Style"
          value={settings.visualStyle}
          options={OPTIONS.visualStyle}
          onChange={(v) => onChange("visualStyle", v as VisualStyle)}
        />
      </div>
      {aspectRatio !== "9:16 Shorts" && (
        <p className="text-[11px] text-amber-400">
          Only 9:16 vertical rendering is currently supported — other aspect ratios are saved but
          the export will still be 1080×1920.
        </p>
      )}
    </div>
  );
}
