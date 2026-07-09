import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { runFfmpeg } from "@/lib/ffmpegRunner";

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
};

export async function POST(request: NextRequest) {
  const { projectId, sceneNumber, imageDataUrl } = (await request.json()) as {
    projectId: string;
    sceneNumber: number;
    imageDataUrl: string;
  };

  if (!projectId || !sceneNumber || !imageDataUrl) {
    return NextResponse.json(
      { error: "projectId, sceneNumber, and imageDataUrl are required." },
      { status: 400 }
    );
  }

  const match = /^data:(image\/[\w.+-]+);base64,(.+)$/.exec(imageDataUrl);
  if (!match) {
    return NextResponse.json({ error: "Invalid image data URL." }, { status: 400 });
  }
  const ext = EXT_BY_MIME[match[1]] ?? "jpg";
  const buffer = Buffer.from(match[2], "base64");

  const dir = path.join(process.cwd(), "public", "generated", projectId);
  await fs.mkdir(dir, { recursive: true });

  const imageFile = `scene-${sceneNumber}.png`;
  const tmpFile = `scene-${sceneNumber}-upload-tmp.${ext}`;
  await fs.writeFile(path.join(dir, tmpFile), buffer);

  try {
    // Normalize any uploaded format to PNG so the render pipeline can rely on a
    // consistent filename regardless of whether an image was AI-generated or uploaded.
    await runFfmpeg(["-y", "-i", tmpFile, imageFile], dir);
  } catch (err) {
    return NextResponse.json(
      { error: `Could not process the uploaded image: ${err instanceof Error ? err.message : "unknown error"}` },
      { status: 500 }
    );
  } finally {
    await fs.unlink(path.join(dir, tmpFile)).catch(() => {});
  }

  return NextResponse.json({ imageUrl: `/generated/${projectId}/${imageFile}` });
}
