import fs from "fs/promises";
import path from "path";
import { GeneratedProject } from "@/types/project";
import { parseTimeToSeconds } from "@/lib/sceneTiming";
import { runFfmpeg } from "@/lib/ffmpegRunner";
import { generateBackgroundMusic } from "@/lib/musicGen";

export async function renderProject(project: GeneratedProject, dir: string): Promise<void> {
  const segmentFiles: string[] = [];

  for (const scene of project.scenes) {
    if (!scene.audioUrl || (!scene.imageUrl && !scene.videoClipUrl)) {
      throw new Error(`Scene ${scene.scene} is missing generated visual or audio assets.`);
    }

    const duration = Math.max(1, parseTimeToSeconds(scene.end) - parseTimeToSeconds(scene.start));
    const audioFile = `scene-${scene.scene}.wav`;
    const fixedAudioFile = `scene-${scene.scene}-fixed.wav`;
    const segmentFile = `segment-${scene.scene}.mp4`;

    await runFfmpeg(
      ["-y", "-i", audioFile, "-af", "apad", "-t", String(duration), fixedAudioFile],
      dir
    );

    const useVideoClip = scene.mediaType === "video" && scene.videoClipUrl;

    if (useVideoClip) {
      const clipFile = `scene-${scene.scene}-clip.mp4`;
      await runFfmpeg(
        [
          "-y",
          "-stream_loop",
          "-1",
          "-i",
          clipFile,
          "-i",
          fixedAudioFile,
          "-vf",
          "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30",
          "-map",
          "0:v:0",
          "-map",
          "1:a:0",
          "-c:v",
          "libx264",
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "aac",
          "-t",
          String(duration),
          segmentFile,
        ],
        dir
      );
    } else {
      const imageFile = `scene-${scene.scene}.png`;
      await runFfmpeg(
        [
          "-y",
          "-loop",
          "1",
          "-i",
          imageFile,
          "-i",
          fixedAudioFile,
          "-vf",
          "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30",
          "-c:v",
          "libx264",
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "aac",
          "-t",
          String(duration),
          "-shortest",
          segmentFile,
        ],
        dir
      );
    }

    segmentFiles.push(segmentFile);
  }

  const concatListPath = path.join(dir, "concat.txt");
  const concatList = segmentFiles.map((f) => `file '${f}'`).join("\n");
  await fs.writeFile(concatListPath, concatList);

  await runFfmpeg(
    ["-y", "-f", "concat", "-safe", "0", "-i", "concat.txt", "-c", "copy", "concat-output.mp4"],
    dir
  );

  const totalDuration = project.scenes.reduce(
    (sum, s) => sum + (parseTimeToSeconds(s.end) - parseTimeToSeconds(s.start)),
    0
  );
  const hasMusic = await generateBackgroundMusic(
    dir,
    project.music.style,
    project.tone,
    project.music.volume,
    totalDuration
  );

  let videoWithAudio = "concat-output.mp4";
  if (hasMusic) {
    await runFfmpeg(
      [
        "-y",
        "-i",
        "concat-output.mp4",
        "-i",
        "music.wav",
        "-filter_complex",
        "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=2[aout]",
        "-map",
        "0:v",
        "-map",
        "[aout]",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "music-mixed.mp4",
      ],
      dir
    );
    videoWithAudio = "music-mixed.mp4";
  }

  const hasSubtitles = await fs
    .access(path.join(dir, "subtitles.srt"))
    .then(() => true)
    .catch(() => false);

  if (hasSubtitles) {
    await runFfmpeg(
      [
        "-y",
        "-i",
        videoWithAudio,
        "-vf",
        "subtitles=subtitles.srt:force_style='FontName=Arial,FontSize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Alignment=2,MarginV=80'",
        "-c:a",
        "copy",
        "final.mp4",
      ],
      dir
    );
  } else {
    await fs.copyFile(path.join(dir, videoWithAudio), path.join(dir, "final.mp4"));
  }
}
