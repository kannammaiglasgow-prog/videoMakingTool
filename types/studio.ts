export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  selected: boolean;
}

export type LanguageExportStatus =
  | "queued"
  | "translating"
  | "generating-voice"
  | "generating-subtitles"
  | "rendering"
  | "completed"
  | "failed";

export interface LanguageExport {
  languageCode: string;
  languageName: string;
  nativeName: string;
  flag: string;
  voiceName: string;
  status: LanguageExportStatus;
  progress: number;
  previewUrl?: string;
  downloadUrl?: string;
}

export interface Scene {
  id: number;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  thumbnail: string;
}

export interface VideoSettingsState {
  videoLength: string;
  language: string;
  aspectRatio: string;
  platform: string;
  targetAudience: string;
  tone: string;
  videoStyle: string;
  voiceStyle: string;
  musicStyle: string;
  visualStyle: string;
}

export type OutputTab =
  | "AI Plan"
  | "Script"
  | "Scenes"
  | "Images"
  | "Voice"
  | "Subtitles"
  | "Timeline";
