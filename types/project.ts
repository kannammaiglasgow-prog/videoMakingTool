export type VideoLength = 15 | 30 | 45 | 60 | 120 | 300 | 480 | 600;

export type Language =
  | "Tamil"
  | "English"
  | "Hindi"
  | "Malayalam"
  | "Telugu"
  | "Kannada"
  | "Arabic"
  | "French"
  | "German"
  | "Spanish";

export type Audience =
  | "General Public"
  | "Students"
  | "Parents"
  | "Professionals"
  | "Kids"
  | "Social Media Audience";

export type Tone =
  | "Neutral"
  | "Supportive"
  | "Opposing"
  | "Serious"
  | "Exciting"
  | "Funny"
  | "Emotional"
  | "Documentary";

export type Style =
  | "Breaking News"
  | "Storytelling"
  | "Documentary"
  | "Comedy"
  | "Educational"
  | "Cinematic"
  | "Social Commentary";

export type Voice =
  | "Male News Reader"
  | "Female News Reader"
  | "Male Narrator"
  | "Female Narrator"
  | "Calm Voice"
  | "Energetic Voice";

export type MusicStyle =
  | "Auto"
  | "No Music"
  | "Suspense"
  | "Epic"
  | "News"
  | "Emotional"
  | "Funny"
  | "Cinematic";

export type VisualStyle = "Realistic" | "Cinematic" | "Documentary" | "AI Art" | "3D" | "Cartoon";

export type Platform = "YouTube Shorts" | "Instagram Reels" | "TikTok" | "Facebook Reels";

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
  mediaType?: "image" | "video";
  videoClipUrl?: string;
  videoClipCredit?: string;
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
  siblings?: { id: string; language: Language }[];
}
