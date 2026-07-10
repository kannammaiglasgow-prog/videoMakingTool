import fs from "fs/promises";
import path from "path";
import { generateVoiceover } from "@/lib/audioAgent";
import { generateSrt, generateVtt } from "@/lib/subtitles";
import { GeneratedProject, Scene } from "@/types/project";

export interface AssetGenOptions {
  sceneNumbers?: number[];
}

export function projectDir(projectId: string): string {
  return path.join(process.cwd(), "public", "generated", projectId);
}

/**
 * Generates voiceover only. AI image generation was removed entirely (cost
 * driver) — a scene's visual must come from a manual upload or a stock
 * video (Pixabay/Pexels) via the dedicated endpoints for those.
 */
export async function generateProjectAssets(
  project: GeneratedProject,
  options: AssetGenOptions = {}
): Promise<GeneratedProject> {
  const { sceneNumbers } = options;

  const dir = projectDir(project.id);
  await fs.mkdir(dir, { recursive: true });

  const targetSet = sceneNumbers ? new Set(sceneNumbers) : null;

  const scenes: Scene[] = await Promise.all(
    project.scenes.map(async (scene) => {
      if (targetSet && !targetSet.has(scene.scene)) {
        return scene;
      }

      const result: Scene = { ...scene, assetError: undefined };

      try {
        const audioBuffer = await generateVoiceover(scene.voiceover, project.voice, project.language);
        const audioFile = `scene-${scene.scene}.wav`;
        await fs.writeFile(path.join(dir, audioFile), audioBuffer);
        result.audioUrl = `/generated/${project.id}/${audioFile}`;
      } catch (err) {
        result.assetError = `Voiceover generation failed: ${err instanceof Error ? err.message : "unknown error"}`;
      }

      return result;
    })
  );

  const srt = generateSrt(scenes);
  const vtt = generateVtt(scenes);
  await fs.writeFile(path.join(dir, "subtitles.srt"), srt);
  await fs.writeFile(path.join(dir, "subtitles.vtt"), vtt);

  return {
    ...project,
    scenes,
    subtitles: {
      srtUrl: `/generated/${project.id}/subtitles.srt`,
      vttUrl: `/generated/${project.id}/subtitles.vtt`,
    },
    assetsGenerated: true,
  };
}

/**
 * Copies each scene's already-generated visual (image or stock video clip)
 * from a base project's asset folder into a sibling (translated) project's
 * own folder, so the sibling can render standalone without paying to
 * regenerate the same visuals per language.
 */
export async function copySceneVisuals(
  baseProject: GeneratedProject,
  targetProject: GeneratedProject
): Promise<GeneratedProject> {
  const baseDir = projectDir(baseProject.id);
  const targetDir = projectDir(targetProject.id);
  await fs.mkdir(targetDir, { recursive: true });

  const scenes: Scene[] = await Promise.all(
    targetProject.scenes.map(async (scene) => {
      const baseScene = baseProject.scenes.find((s) => s.scene === scene.scene);
      if (!baseScene) return scene;

      const result: Scene = { ...scene };

      if (baseScene.mediaType === "video" && baseScene.videoClipUrl) {
        const clipFile = `scene-${scene.scene}-clip.mp4`;
        await fs.copyFile(path.join(baseDir, clipFile), path.join(targetDir, clipFile));
        result.mediaType = "video";
        result.videoClipUrl = `/generated/${targetProject.id}/${clipFile}`;
        result.videoClipCredit = baseScene.videoClipCredit;
      } else if (baseScene.imageUrl) {
        const imageFile = `scene-${scene.scene}.png`;
        await fs.copyFile(path.join(baseDir, imageFile), path.join(targetDir, imageFile));
        result.imageUrl = `/generated/${targetProject.id}/${imageFile}`;
      }

      return result;
    })
  );

  return { ...targetProject, scenes };
}
