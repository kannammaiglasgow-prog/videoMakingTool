import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { renderProject } from "@/lib/videoRender";
import { GeneratedProject } from "@/types/project";

export async function POST(request: NextRequest) {
  const { project } = (await request.json()) as { project: GeneratedProject };

  if (!project?.id || !project.assetsGenerated) {
    return NextResponse.json(
      { error: "Generate images and voiceover before rendering." },
      { status: 400 }
    );
  }

  const dir = path.join(process.cwd(), "public", "generated", project.id);

  try {
    await renderProject(project, dir);
  } catch (err) {
    console.error("Video render failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Video rendering failed." },
      { status: 500 }
    );
  }

  return NextResponse.json({ videoUrl: `/generated/${project.id}/final.mp4` });
}
