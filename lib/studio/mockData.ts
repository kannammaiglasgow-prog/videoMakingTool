import { LanguageExport, LanguageOption, Scene, VideoSettingsState } from "@/types/studio";

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳", selected: true },
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧", selected: true },
  { code: "hi", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳", selected: true },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳", selected: true },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳", selected: true },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳", selected: true },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", selected: false },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", selected: false },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", selected: false },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", selected: false },
];

export const MOCK_LANGUAGE_EXPORTS: LanguageExport[] = [
  {
    languageCode: "ta",
    languageName: "Tamil (Default)",
    nativeName: "தமிழ்",
    flag: "🇮🇳",
    voiceName: "Male News",
    status: "completed",
    progress: 100,
    previewUrl: "#",
    downloadUrl: "#",
  },
  {
    languageCode: "en",
    languageName: "English",
    nativeName: "English",
    flag: "🇬🇧",
    voiceName: "Male News",
    status: "completed",
    progress: 100,
    previewUrl: "#",
    downloadUrl: "#",
  },
  {
    languageCode: "hi",
    languageName: "Hindi",
    nativeName: "हिंदी",
    flag: "🇮🇳",
    voiceName: "Male News",
    status: "rendering",
    progress: 75,
  },
  {
    languageCode: "ml",
    languageName: "Malayalam",
    nativeName: "മലയാളം",
    flag: "🇮🇳",
    voiceName: "Male News",
    status: "rendering",
    progress: 40,
  },
  {
    languageCode: "te",
    languageName: "Telugu",
    nativeName: "తెలుగు",
    flag: "🇮🇳",
    voiceName: "Male News",
    status: "queued",
    progress: 0,
  },
  {
    languageCode: "kn",
    languageName: "Kannada",
    nativeName: "ಕನ್ನಡ",
    flag: "🇮🇳",
    voiceName: "Male News",
    status: "queued",
    progress: 0,
  },
];

export const MOCK_SCENES: Scene[] = [
  {
    id: 1,
    startTime: "0:00",
    endTime: "0:03",
    title: "Hook",
    description: "Opening with trophy celebration and news headline.",
    thumbnail: "🏆",
  },
  {
    id: 2,
    startTime: "0:03",
    endTime: "0:07",
    title: "Context",
    description: "Match context and final highlight.",
    thumbnail: "🏏",
  },
  {
    id: 3,
    startTime: "0:07",
    endTime: "0:13",
    title: "Key Moments",
    description: "Top moments from the match.",
    thumbnail: "⚡",
  },
  {
    id: 4,
    startTime: "0:13",
    endTime: "0:19",
    title: "Winning Moment",
    description: "The final winning moment and player reactions.",
    thumbnail: "🎉",
  },
  {
    id: 5,
    startTime: "0:19",
    endTime: "0:25",
    title: "Player Reactions",
    description: "Celebration and emotional reactions.",
    thumbnail: "😊",
  },
  {
    id: 6,
    startTime: "0:25",
    endTime: "0:30",
    title: "Conclusion & CTA",
    description: "Proud moment for 140 crore Indians!",
    thumbnail: "🇮🇳",
  },
];

export const DEFAULT_VIDEO_SETTINGS: VideoSettingsState = {
  videoLength: "30 Seconds",
  language: "Tamil",
  aspectRatio: "9:16 Shorts",
  platform: "YouTube Shorts",
  targetAudience: "General Public",
  tone: "Exciting",
  videoStyle: "Breaking News",
  voiceStyle: "Male News Reader",
  musicStyle: "Suspense / Epic",
  visualStyle: "Realistic",
};

export const MOCK_SCRIPT_TAMIL =
  "தென் ஆப்பிரிக்காவை வீழ்த்தி இந்தியா T20 உலகக்கோப்பை 2024-ஐ வென்றது! இது 140 கோடி இந்தியர்களுக்கும் மிக்க பெருமைக்குரிய தருணம்! 🇮🇳";

export const MOCK_CONTENT_INPUT =
  "India wins the T20 World Cup 2024 after defeating South Africa in a thrilling final. This victory is a proud moment for 140 crore Indians! 🇮🇳";
