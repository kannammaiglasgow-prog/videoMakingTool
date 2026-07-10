import { LanguageOption } from "@/types/studio";
import { ProjectSettings } from "@/types/project";

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "Tamil", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳", selected: true },
  { code: "English", name: "English", nativeName: "English", flag: "🇬🇧", selected: true },
  { code: "Hindi", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳", selected: false },
  { code: "Malayalam", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳", selected: false },
  { code: "Telugu", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳", selected: false },
  { code: "Kannada", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳", selected: false },
  { code: "Arabic", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", selected: false },
  { code: "French", name: "French", nativeName: "Français", flag: "🇫🇷", selected: false },
  { code: "German", name: "German", nativeName: "Deutsch", flag: "🇩🇪", selected: false },
  { code: "Spanish", name: "Spanish", nativeName: "Español", flag: "🇪🇸", selected: false },
];

export const DEFAULT_SETTINGS: ProjectSettings = {
  duration: 30,
  language: "Tamil",
  audience: "General Public",
  tone: "Exciting",
  style: "Breaking News",
  voice: "Male News Reader",
  music: "Suspense",
  visualStyle: "Realistic",
  platform: "YouTube Shorts",
};

export const DEFAULT_CONTENT_INPUT =
  "India wins the T20 World Cup 2024 after defeating South Africa in a thrilling final. This victory is a proud moment for 140 crore Indians! 🇮🇳";
