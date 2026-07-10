import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { ZipArchive } from "archiver";
import { PassThrough } from "stream";

export async function POST(request: NextRequest) {
  const { projects } = (await request.json()) as {
    projects: { id: string; language: string }[];
  };

  if (!projects || projects.length === 0) {
    return NextResponse.json({ error: "At least one project is required." }, { status: 400 });
  }

  const archive = new ZipArchive({ zlib: { level: 9 } });
  const stream = new PassThrough();
  const chunks: Buffer[] = [];
  archive.pipe(stream);
  stream.on("data", (chunk) => chunks.push(chunk));

  const done = new Promise<void>((resolve, reject) => {
    stream.on("end", () => resolve());
    archive.on("error", reject);
  });

  let added = 0;
  for (const p of projects) {
    const filePath = path.join(process.cwd(), "public", "generated", p.id, "final.mp4");
    try {
      await fs.access(filePath);
      archive.file(filePath, { name: `video-${p.language.toLowerCase()}.mp4` });
      added++;
    } catch {
      // Skip languages that haven't been rendered yet.
    }
  }

  if (added === 0) {
    return NextResponse.json({ error: "No rendered videos are available yet." }, { status: 400 });
  }

  await archive.finalize();
  await done;
  const buffer = Buffer.concat(chunks);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=multi-language-videos.zip",
    },
  });
}
