import { GenerateInput, GeneratedProject, Scene } from "@/types/project";
import { generateJSON } from "@/lib/gemini";
import { buildSceneTimestamps, formatTime, sceneCountForDuration } from "@/lib/sceneTiming";

const WORD_TARGETS: Record<number, string> = {
  15: "35-45 words",
  30: "70-90 words",
  45: "100-130 words",
  60: "140-170 words",
  120: "280-340 words",
  300: "700-850 words",
  480: "1120-1360 words",
  600: "1400-1700 words",
};

interface AiSceneContent {
  voiceover: string;
  visual: string;
  imagePrompt: string;
  cameraMovement: string;
  subtitle: string;
  soundEffect: string;
}

interface AiScriptResponse {
  title: string;
  script: string;
  scenes: AiSceneContent[];
}

const SCENE_SCHEMA = {
  type: "object",
  properties: {
    voiceover: { type: "string" },
    visual: { type: "string" },
    imagePrompt: { type: "string" },
    cameraMovement: { type: "string" },
    subtitle: { type: "string" },
    soundEffect: { type: "string" },
  },
  required: ["voiceover", "visual", "imagePrompt", "cameraMovement", "subtitle", "soundEffect"],
};

function buildResponseSchema(sceneCount: number) {
  // Gemini rejects schemas with a large exact-length array constraint
  // ("too many states for serving"), so only pin minItems/maxItems for
  // small scene counts; longer videos rely on the prompt's "exactly N
  // scenes" instruction plus the caller's own count/duplicate checks.
  const lengthConstraint =
    sceneCount <= 15 ? { minItems: sceneCount, maxItems: sceneCount } : {};

  return {
    type: "object",
    properties: {
      title: { type: "string" },
      script: { type: "string" },
      scenes: {
        type: "array",
        items: SCENE_SCHEMA,
        ...lengthConstraint,
      },
    },
    required: ["title", "script", "scenes"],
  };
}

function buildPrompt(input: GenerateInput, sceneCount: number): string {
  const { text, settings } = input;
  const wordTarget = WORD_TARGETS[settings.duration] ?? "70-90 words";

  return `You are a YouTube Shorts creative director. Analyze the following input and produce a short vertical video plan.

INPUT TEXT / TOPIC:
"""
${text}
"""

SETTINGS:
- Duration: ${settings.duration} seconds
- Language: ${settings.language} (write the script and subtitles in this language)
- Target audience: ${settings.audience}
- Tone: ${settings.tone}
- Style: ${settings.style}
- Voice: ${settings.voice}
- Music style: ${settings.music}
- Visual style: ${settings.visualStyle}
- Platform: ${settings.platform}

TASK:
1. Write a short catchy title for the video.
2. Write a voiceover script of approximately ${wordTarget}, matching the tone, style, audience, and language above. Avoid fake news, hate speech, or graphic violence. If the input is a news topic, keep claims factual and neutral where the tone allows.
3. Split the script into exactly ${sceneCount} DISTINCT scenes that together cover the full script in order (scene 1 = hook, last scene = conclusion/call to action). Every scene must have its own unique voiceover line, visual, image prompt, and subtitle — never repeat the same content across two scenes. For each scene provide:
   - voiceover: the exact voiceover line(s) for that scene (a slice of the full script)
   - visual: a short description of what should be shown on screen
   - imagePrompt: a detailed AI image generation prompt (main subject, background, mood, lighting, camera angle, ${settings.visualStyle} visual style, 9:16 vertical format, no text inside the image unless required)
   - cameraMovement: e.g. "Slow zoom in", "Pan left", "Static hold"
   - subtitle: short subtitle text for this scene (can match or shorten the voiceover)
   - soundEffect: a brief sound effect suggestion, or "none"

Respond with JSON only, matching the required schema.`;
}

export async function generateScriptAndScenes(input: GenerateInput): Promise<GeneratedProject> {
  const sceneCount = sceneCountForDuration(input.settings.duration);
  const prompt = buildPrompt(input, sceneCount);

  // Each scene's JSON fields run roughly 150-250 tokens; longer videos need a
  // proportionally larger output budget or Gemini truncates the response.
  const maxOutputTokens = Math.min(65536, sceneCount * 300 + 3000);

  const ai = await generateJSON<AiScriptResponse>(
    prompt,
    buildResponseSchema(sceneCount),
    maxOutputTokens
  );

  if (!ai.scenes || ai.scenes.length === 0) {
    throw new Error("Gemini returned no scenes.");
  }

  const uniqueVoiceoverLines = new Set(ai.scenes.map((s) => s.voiceover.trim().toLowerCase()));
  if (uniqueVoiceoverLines.size < ai.scenes.length) {
    throw new Error("Gemini returned duplicate scenes.");
  }

  // Defensive: if the model still returns a different count than requested,
  // re-derive timestamps for however many distinct scenes it actually gave us
  // instead of duplicating the last scene to fill the gap.
  const timestamps = buildSceneTimestamps(input.settings.duration, ai.scenes.length);

  const scenes: Scene[] = timestamps.map((t, i) => {
    const s = ai.scenes[i];
    return {
      scene: i + 1,
      start: formatTime(t.start),
      end: formatTime(t.end),
      voiceover: s.voiceover,
      visual: s.visual,
      imagePrompt: s.imagePrompt,
      cameraMovement: s.cameraMovement,
      subtitle: s.subtitle,
      soundEffect: s.soundEffect,
    };
  });

  return {
    id: crypto.randomUUID(),
    title: ai.title,
    duration: input.settings.duration,
    language: input.settings.language,
    tone: input.settings.tone,
    style: input.settings.style,
    voice: input.settings.voice,
    script: ai.script,
    scenes,
    music: {
      style: input.settings.music,
      volume: "low",
    },
    export: {
      format: "mp4",
      resolution: "1080x1920",
      fps: 30,
    },
  };
}
