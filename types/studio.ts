import { Language } from "@/types/project";

export interface LanguageOption {
  code: Language;
  name: Language;
  nativeName: string;
  flag: string;
  selected: boolean;
}

export type StudioStatus =
  | "queued"
  | "translating"
  | "generating-voice"
  | "rendering"
  | "completed"
  | "failed";

export interface LanguageExportRow {
  projectId: string;
  languageCode: Language;
  languageName: Language;
  nativeName: string;
  flag: string;
  voiceName: string;
  status: StudioStatus;
  progress: number;
  previewUrl?: string;
  downloadUrl?: string;
  errorMessage?: string;
}

export interface StudioScene {
  id: number;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  thumbnail: string;
  imageUrl?: string;
  videoClipUrl?: string;
  mediaType?: "image" | "video";
  assetError?: string;
}

export type OutputTab =
  | "AI Plan"
  | "Script"
  | "Scenes"
  | "Videos"
  | "Voice"
  | "Subtitles"
  | "Timeline";
