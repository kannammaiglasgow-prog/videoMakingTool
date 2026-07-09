import { execFile } from "child_process";

function getFfmpegPath() {
  return process.env.FFMPEG_PATH || "ffmpeg";
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
