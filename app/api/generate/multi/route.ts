import { NextRequest, NextResponse } from "next/server";
import { generateScriptAndScenes } from "@/lib/scriptAgent";
import { translateProject } from "@/lib/translateAgent";
import { mockGenerateProject } from "@/lib/mockAi";
import { generateProjectAssets, copySceneVisuals } from "@/lib/assetGeneration";
import { GenerateInput, GeneratedProject, Language } from "@/types/project";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as GenerateInput & { languages: Language[] };
  const { languages } = body;

  if (!body.text || !body.text.trim()) {
    return NextResponse.json({ error: "Text input is required." }, { status: 400 });
  }
  if (!languages || languages.length === 0) {
    return NextResponse.json({ error: "At least one language is required." }, { status: 400 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });
  }

  const [primaryLanguage, ...otherLanguages] = languages;
  const baseInput: GenerateInput = {
    ...body,
    settings: { ...body.settings, language: primaryLanguage },
  };

  let base: GeneratedProject;
  try {
    base = await generateScriptAndScenes(baseInput);
  } catch (err) {
    console.error("Gemini generation failed, falling back to mock:", err);
    base = mockGenerateProject(baseInput);
    base.generationWarning =
      "AI generation failed, showing a mock preview instead. " +
      (err instanceof Error ? err.message : "Unknown error.");
  }

  // Images/video are generated once on the base-language project and reused
  // across every other language to avoid paying for them N times.
  base = await generateProjectAssets(base);

  const projects: GeneratedProject[] = [base];

  for (const lang of otherLanguages) {
    try {
      let translated = await translateProject(base, lang);
      translated = await copySceneVisuals(base, translated);
      translated = await generateProjectAssets(translated, { assetTypes: ["audio"] });
      projects.push(translated);
    } catch (err) {
      console.error(`Translation to ${lang} failed:`, err);
      projects.push({
        ...base,
        id: crypto.randomUUID(),
        language: lang,
        generationWarning: `Could not generate the ${lang} version: ${
          err instanceof Error ? err.message : "unknown error"
        }`,
        assetsGenerated: false,
      });
    }
  }

  const siblings = projects.map((p) => ({ id: p.id, language: p.language }));
  const withSiblings = projects.map((p) => ({
    ...p,
    siblings: siblings.filter((s) => s.id !== p.id),
  }));

  return NextResponse.json({ projects: withSiblings });
}
