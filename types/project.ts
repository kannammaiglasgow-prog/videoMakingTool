export type VideoLength = 15 | 30 | 45 | 60;

export type Language = "Tamil" | "English" | "Hindi" | "Malayalam" | "Telugu";

export type Audience =
  | "General public"
  | "Students"
  | "Parents"
  | "Professionals"
  | "Kids";

export type Tone =
  | "Neutral"
  | "Supportive"
  | "Against"
  | "Funny"
  | "Serious"
  | "Emotional"
  | "Motivational"
  | "Documentary";

export type Style =
  | "Breaking news"
  | "Storytelling"
  | "Comedy"
  | "Educational"
  | "Cinematic"
  | "Documentary";

export type Voice = "Male" | "Female" | "News reader" | "Narrator";

export type MusicStyle =
  | "Auto"
  | "No music"
  | "Emotional"
  | "Funny"
  | "Suspense"
  | "News"
  | "Cinematic";

export type VisualStyle =
  | "Realistic"
  | "AI art"
  | "3D"
  | "Documentary"
  | "Cinematic"
  | "Cartoon";

export type Platform = "YouTube Shorts" | "Instagram Reel" | "TikTok";

export interface ProjectSettings {
  duration: VideoLength;
  language: Language;
  audience: Audience;
  tone: Tone;
  style: Style;
  voice: Voice;
  music: MusicStyle;
  visualStyle: VisualStyle;
  platform: Platform;
}

export interface GenerateInput {
  text: string;
  imageDataUrl?: string;
  settings: ProjectSettings;
}

export interface Scene {
  scene: number;
  start: string;
  end: string;
  voiceover: string;
  visual: string;
  imagePrompt: string;
  cameraMovement: string;
  subtitle: string;
  soundEffect: string;
  imageUrl?: string;
  audioUrl?: string;
  assetError?: string;
}

export interface GeneratedProject {
  id: string;
  generationWarning?: string;
  title: string;
  duration: VideoLength;
  language: Language;
  tone: Tone;
  style: Style;
  voice: Voice;
  script: string;
  scenes: Scene[];
  music: {
    style: MusicStyle;
    volume: "low" | "medium" | "high";
  };
  export: {
    format: "mp4";
    resolution: "1080x1920";
    fps: 30;
  };
  subtitles?: {
    srtUrl: string;
    vttUrl: string;
  };
  assetsGenerated?: boolean;
  videoUrl?: string;
}
