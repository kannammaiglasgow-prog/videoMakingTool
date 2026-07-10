import { NextRequest, NextResponse } from "next/server";
import { generateProjectAssets, copySceneVisuals } from "@/lib/assetGeneration";
import { GeneratedProject } from "@/types/project";

export async function POST(request: NextRequest) {
  const { baseProject, siblingProjects } = (await request.json()) as {
    baseProject: GeneratedProject;
    siblingProjects: GeneratedProject[];
  };

  if (!baseProject?.id || !baseProject.scenes?.length) {
    return NextResponse.json({ error: "A valid base project is required." }, { status: 400 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });
  }

  // Voiceover for the base language, if it hasn't been done yet. Visuals
  // (image upload / Pixabay / Pexels) are set separately per scene, not
  // generated here.
  const base = baseProject.assetsGenerated
    ? baseProject
    : await generateProjectAssets(baseProject);

  const siblings: GeneratedProject[] = [];
  for (const sibling of siblingProjects ?? []) {
    try {
      let updated = await copySceneVisuals(base, sibling);
      updated = await generateProjectAssets(updated);
      siblings.push(updated);
    } catch (err) {
      siblings.push({
        ...sibling,
        generationWarning: `Could not generate assets for ${sibling.language}: ${
          err instanceof Error ? err.message : "unknown error"
        }`,
      });
    }
  }

  return NextResponse.json({ base, siblings });
}
