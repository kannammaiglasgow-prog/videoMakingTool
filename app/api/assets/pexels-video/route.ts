import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { searchAndDownloadSceneVideo } from "@/lib/pexelsAgent";

export async function POST(request: NextRequest) {
  const { projectId, sceneNumber, query } = (await request.json()) as {
    projectId: string;
    sceneNumber: number;
    query: string;
  };

  if (!projectId || !sceneNumber || !query?.trim()) {
    return NextResponse.json(
      { error: "projectId, sceneNumber, and a search query are required." },
      { status: 400 }
    );
  }

  if (!process.env.PEXELS_API_KEY) {
    return NextResponse.json({ error: "PEXELS_API_KEY is not configured." }, { status: 500 });
  }

  const dir = path.join(process.cwd(), "public", "generated", projectId);
  await fs.mkdir(dir, { recursive: true });

  try {
    const { buffer, credit } = await searchAndDownloadSceneVideo(query);
    const clipFile = `scene-${sceneNumber}-clip.mp4`;
    await fs.writeFile(path.join(dir, clipFile), buffer);

    return NextResponse.json({
      videoClipUrl: `/generated/${projectId}/${clipFile}`,
      credit,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pexels video search failed." },
      { status: 500 }
    );
  }
}
