import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { projectId, sceneNumber, downloadUrl, credit } = await request.json();

    if (!projectId || !sceneNumber || !downloadUrl) {
      return NextResponse.json({ error: "projectId, sceneNumber, and downloadUrl are required." }, { status: 400 });
    }

    const dir = path.join(process.cwd(), "public", "generated", projectId);
    await fs.mkdir(dir, { recursive: true });

    const videoRes = await fetch(downloadUrl);
    if (!videoRes.ok) {
      throw new Error(`Failed to download selected video clip (${videoRes.status}).`);
    }

    const arrayBuffer = await videoRes.arrayBuffer();
    const clipFile = `scene-${sceneNumber}-clip.mp4`;
    await fs.writeFile(path.join(dir, clipFile), Buffer.from(arrayBuffer));

    return NextResponse.json({
      videoClipUrl: `/generated/${projectId}/${clipFile}`,
      credit: credit || "Selected Stock Video Clip",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Downloading selected video failed." },
      { status: 500 }
    );
  }
}
