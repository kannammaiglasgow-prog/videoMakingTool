import { execFile } from "child_process";

function getFfmpegPath() {
  return process.env.FFMPEG_PATH || "ffmpeg";
}

function getFfprobePath() {
  const ffmpegPath = getFfmpegPath();
  if (ffmpegPath === "ffmpeg") return "ffprobe";
  return ffmpegPath.replace(/ffmpeg\.exe$/i, "ffprobe.exe");
}

export function runFfmpeg(args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      getFfmpegPath(),
      args,
      { cwd, maxBuffer: 1024 * 1024 * 50 },
      (error, _stdout, stderr) => {
        if (error) {
          reject(new Error(`ffmpeg failed: ${error.message}\n${stderr}`));
          return;
        }
        resolve();
      }
    );
  });
}

export function getMediaDuration(file: string, cwd: string): Promise<number> {
  return new Promise((resolve, reject) => {
    execFile(
      getFfprobePath(),
      ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
      { cwd, maxBuffer: 1024 * 1024 * 10 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`ffprobe failed: ${error.message}\n${stderr}`));
          return;
        }
        const seconds = parseFloat(stdout.trim());
        if (Number.isNaN(seconds)) {
          reject(new Error(`ffprobe returned an invalid duration for ${file}: "${stdout}"`));
          return;
        }
        resolve(seconds);
      }
    );
  });
}
