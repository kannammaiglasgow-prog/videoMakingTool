import { NextRequest, NextResponse } from "next/server";
import { translateProject } from "@/lib/translateAgent";
import { generateProjectAssets, copySceneVisuals } from "@/lib/assetGeneration";
import { GeneratedProject, Language } from "@/types/project";

export async function POST(request: NextRequest) {
  const { baseProject, language, existingId } = (await request.json()) as {
    baseProject: GeneratedProject;
    language: Language;
    existingId: string;
  };

  if (!baseProject?.id || !language || !existingId) {
    return NextResponse.json(
      { error: "baseProject, language, and existingId are required." },
      { status: 400 }
    );
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });
  }

  try {
    let translated = await translateProject(baseProject, language);
    // Reuse the original id so this stays linked in every sibling's
    // `siblings` list and keeps the same localStorage/asset folder key.
    translated = { ...translated, id: existingId };
    translated = await copySceneVisuals(baseProject, translated);
    translated = await generateProjectAssets(translated);
    return NextResponse.json(translated);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Retry failed." },
      { status: 500 }
    );
  }
}
