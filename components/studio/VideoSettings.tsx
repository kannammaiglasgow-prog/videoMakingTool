"use client";

import { VideoSettingsState } from "@/types/studio";
import SelectField from "@/components/studio/ui/SelectField";

const OPTIONS = {
  videoLength: ["15 Seconds", "30 Seconds", "45 Seconds", "60 Seconds"],
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
  ],
  aspectRatio: ["9:16 Shorts", "1:1 Square", "16:9 Landscape"],
  platform: ["YouTube Shorts", "Instagram Reels", "TikTok", "Facebook Reels"],
  targetAudience: [
    "General Public",
    "Students",
    "Parents",
    "Professionals",
    "Kids",
    "Social Media Audience",
  ],
  tone: [
    "Neutral",
    "Supportive",
    "Opposing",
    "Serious",
    "Exciting",
    "Funny",
    "Emotional",
    "Documentary",
  ],
  videoStyle: [
    "Breaking News",
    "Storytelling",
    "Documentary",
    "Comedy",
    "Educational",
    "Cinematic",
    "Social Commentary",
  ],
  voiceStyle: [
    "Male News Reader",
    "Female News Reader",
    "Male Narrator",
    "Female Narrator",
    "Calm Voice",
    "Energetic Voice",
  ],
  musicStyle: ["Auto", "No Music", "Suspense", "Epic", "News", "Emotional", "Funny", "Cinematic"],
  visualStyle: ["Realistic", "Cinematic", "Documentary", "AI Art", "3D", "Cartoon"],
} as const;

interface VideoSettingsProps {
  settings: VideoSettingsState;
  onChange: <K extends keyof VideoSettingsState>(key: K, value: VideoSettingsState[K]) => void;
}

export default function VideoSettings({ settings, onChange }: VideoSettingsProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold tracking-wide text-slate-400">2. VIDEO SETTINGS</p>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Video Length"
          value={settings.videoLength}
          options={[...OPTIONS.videoLength]}
          onChange={(v) => onChange("videoLength", v)}
        />
        <SelectField
          label="Language (Default)"
          value={settings.language}
          options={[...OPTIONS.language]}
          onChange={(v) => onChange("language", v)}
        />
        <SelectField
          label="Aspect Ratio"
          value={settings.aspectRatio}
          options={[...OPTIONS.aspectRatio]}
          onChange={(v) => onChange("aspectRatio", v)}
        />
        <SelectField
          label="Platform"
          value={settings.platform}
          options={[...OPTIONS.platform]}
          onChange={(v) => onChange("platform", v)}
        />
        <SelectField
          label="Target Audience"
          value={settings.targetAudience}
          options={[...OPTIONS.targetAudience]}
          onChange={(v) => onChange("targetAudience", v)}
        />
        <SelectField
          label="Tone"
          value={settings.tone}
          options={[...OPTIONS.tone]}
          onChange={(v) => onChange("tone", v)}
        />
        <SelectField
          label="Video Style"
          value={settings.videoStyle}
          options={[...OPTIONS.videoStyle]}
          onChange={(v) => onChange("videoStyle", v)}
        />
        <SelectField
          label="Voice Style"
          value={settings.voiceStyle}
          options={[...OPTIONS.voiceStyle]}
          onChange={(v) => onChange("voiceStyle", v)}
        />
        <SelectField
          label="Music Style"
          value={settings.musicStyle}
          options={[...OPTIONS.musicStyle]}
          onChange={(v) => onChange("musicStyle", v)}
        />
        <SelectField
          label="Visual Style"
          value={settings.visualStyle}
          options={[...OPTIONS.visualStyle]}
          onChange={(v) => onChange("visualStyle", v)}
        />
      </div>
    </div>
  );
}
