import { GeneratedProject, Language, Scene } from "@/types/project";
import { generateJSON } from "@/lib/gemini";

interface TranslatedScene {
  voiceover: string;
  subtitle: string;
}

interface TranslationResponse {
  title: string;
  script: string;
  scenes: TranslatedScene[];
}

const SCENE_SCHEMA = {
  type: "object",
  properties: {
    voiceover: { type: "string" },
    subtitle: { type: "string" },
  },
  required: ["voiceover", "subtitle"],
};

function buildResponseSchema(sceneCount: number) {
  // Same "too many states" limit applies here as in scriptAgent — only pin
  // the exact length for small scene counts.
  const lengthConstraint = sceneCount <= 15 ? { minItems: sceneCount, maxItems: sceneCount } : {};
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

function buildPrompt(base: GeneratedProject, targetLanguage: Language): string {
  const sceneLines = base.scenes
    .map((s) => `Scene ${s.scene} voiceover: ${s.voiceover}\nScene ${s.scene} subtitle: ${s.subtitle}`)
    .join("\n\n");

  return `Translate the following YouTube Shorts video script from ${base.language} into ${targetLanguage}.
Keep the same natural, spoken tone (${base.tone}) and roughly the same length per line — this is a voiceover
script that must still fit the same timing as the original when read aloud. Do not add or remove scenes;
translate exactly ${base.scenes.length} scenes in the same order.

TITLE: ${base.title}

FULL SCRIPT:
"""
${base.script}
"""

SCENES:
${sceneLines}

Respond with JSON only, matching the required schema: a translated title, a translated full script, and
exactly ${base.scenes.length} scenes each with a translated voiceover and subtitle.`;
}

export async function translateProject(
  base: GeneratedProject,
  targetLanguage: Language
): Promise<GeneratedProject> {
  const prompt = buildPrompt(base, targetLanguage);
  const maxOutputTokens = Math.min(65536, base.scenes.length * 200 + 3000);

  const ai = await generateJSON<TranslationResponse>(
    prompt,
    buildResponseSchema(base.scenes.length),
    maxOutputTokens
  );

  if (!ai.scenes || ai.scenes.length !== base.scenes.length) {
    throw new Error(
      `Translation returned ${ai.scenes?.length ?? 0} scenes, expected ${base.scenes.length}.`
    );
  }

  const scenes: Scene[] = base.scenes.map((baseScene, i) => ({
    ...baseScene,
    voiceover: ai.scenes[i].voiceover,
    subtitle: ai.scenes[i].subtitle,
    // Visuals are language-agnostic and already generated once on the base
    // project — reused as-is (files get copied alongside this project by
    // the caller), audio must be regenerated per language.
    audioUrl: undefined,
    assetError: undefined,
  }));

  return {
    ...base,
    id: crypto.randomUUID(),
    title: ai.title,
    language: targetLanguage,
    script: ai.script,
    scenes,
    generationWarning: undefined,
    subtitles: undefined,
    assetsGenerated: false,
    videoUrl: undefined,
  };
}
