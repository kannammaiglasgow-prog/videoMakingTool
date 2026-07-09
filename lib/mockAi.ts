import { GenerateInput, GeneratedProject, Scene } from "@/types/project";
import { buildSceneTimestamps, formatTime, sceneCountForDuration } from "@/lib/sceneTiming";

const SCENE_LABELS = [
  "Hook",
  "Context",
  "Main point",
  "Evidence or explanation",
  "Emotional impact",
  "Conclusion and call to action",
];

// eslint-disable-next-line no-control-regex
const NON_ASCII = /[^\x00-\x7F]/;

export function mockGenerateProject(input: GenerateInput): GeneratedProject {
  const { text, settings } = input;
  const topic = text.trim().split(/\s+/).slice(0, 8).join(" ") || "Untitled topic";
  // Image prompts (and anything derived from them, like Pixabay search) must stay in
  // English regardless of the input/script language, so non-Latin topics get a
  // generic English stand-in here instead of the raw non-English text.
  const englishSubject = NON_ASCII.test(topic)
    ? `a ${settings.tone.toLowerCase()} news story`
    : topic;
  const sceneCount = sceneCountForDuration(settings.duration);
  const timestamps = buildSceneTimestamps(settings.duration, sceneCount);

  const scenes: Scene[] = timestamps.map((t, i) => {
    const label = SCENE_LABELS[i % SCENE_LABELS.length];
    return {
      scene: i + 1,
      start: formatTime(t.start),
      end: formatTime(t.end),
      voiceover: `[${label}] ${topic} — line ${i + 1} of the ${settings.tone.toLowerCase()} script.`,
      visual: `${settings.visualStyle} visual depicting ${topic} (${label.toLowerCase()}).`,
      imagePrompt: `A ${settings.visualStyle.toLowerCase()} 9:16 vertical image related to ${englishSubject}, ${settings.tone.toLowerCase()} mood, cinematic lighting, no text in image.`,
      cameraMovement: i === 0 ? "Slow zoom in" : i === timestamps.length - 1 ? "Static hold" : "Slow pan",
      subtitle: `${label}: ${topic}`,
      soundEffect: i === 0 ? "Whoosh" : i === timestamps.length - 1 ? "Soft fade" : "Subtle transition",
    };
  });

  const script = scenes.map((s) => s.voiceover).join(" ");

  return {
    id: crypto.randomUUID(),
    title: topic,
    duration: settings.duration,
    language: settings.language,
    tone: settings.tone,
    style: settings.style,
    voice: settings.voice,
    script,
    scenes,
    music: {
      style: settings.music,
      volume: "low",
    },
    export: {
      format: "mp4",
      resolution: "1080x1920",
      fps: 30,
    },
  };
}
