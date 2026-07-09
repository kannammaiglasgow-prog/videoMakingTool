import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { generateSceneImage } from "@/lib/visualAgent";
import { generateVoiceover } from "@/lib/audioAgent";
import { generateSrt, generateVtt } from "@/lib/subtitles";
import { GeneratedProject } from "@/types/project";

export async function POST(request: NextRequest) {
  const { project } = (await request.json()) as { project: GeneratedProject };

  if (!project?.id || !project.scenes?.length) {
    return NextResponse.json({ error: "A valid project is required." }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });
  }

  const dir = path.join(process.cwd(), "public", "generated", project.id);
  await fs.mkdir(dir, { recursive: true });

  const scenes = await Promise.all(
    project.scenes.map(async (scene) => {
      const result = { ...scene };
      try {
        const imageBuffer = await generateSceneImage(scene.imagePrompt);
        const imageFile = `scene-${scene.scene}.png`;
        await fs.writeFile(path.join(dir, imageFile), imageBuffer);
        result.imageUrl = `/generated/${project.id}/${imageFile}`;
      } catch (err) {
        result.assetError = `Image generation failed: ${err instanceof Error ? err.message : "unknown error"}`;
      }

      try {
        const audioBuffer = await generateVoiceover(scene.voiceover, project.voice);
        const audioFile = `scene-${scene.scene}.wav`;
        await fs.writeFile(path.join(dir, audioFile), audioBuffer);
        result.audioUrl = `/generated/${project.id}/${audioFile}`;
      } catch (err) {
        result.assetError = [result.assetError, `Voiceover generation failed: ${err instanceof Error ? err.message : "unknown error"}`]
          .filter(Boolean)
          .join(" | ");
      }

      return result;
    })
  );

  const srt = generateSrt(scenes);
  const vtt = generateVtt(scenes);
  await fs.writeFile(path.join(dir, "subtitles.srt"), srt);
  await fs.writeFile(path.join(dir, "subtitles.vtt"), vtt);

  const updatedProject: GeneratedProject = {
    ...project,
    scenes,
    subtitles: {
      srtUrl: `/generated/${project.id}/subtitles.srt`,
      vttUrl: `/generated/${project.id}/subtitles.vtt`,
    },
    assetsGenerated: true,
  };

  return NextResponse.json(updatedProject);
}
