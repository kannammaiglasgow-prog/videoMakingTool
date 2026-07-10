import { NextRequest, NextResponse } from "next/server";
import { generateProjectAssets } from "@/lib/assetGeneration";
import { GeneratedProject } from "@/types/project";

export async function POST(request: NextRequest) {
  const { project, sceneNumbers, assetTypes } = (await request.json()) as {
    project: GeneratedProject;
    sceneNumbers?: number[];
    assetTypes?: ("image" | "audio")[];
  };

  if (!project?.id || !project.scenes?.length) {
    return NextResponse.json({ error: "A valid project is required." }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });
  }

  const updatedProject = await generateProjectAssets(project, { sceneNumbers, assetTypes });
  return NextResponse.json(updatedProject);
}
