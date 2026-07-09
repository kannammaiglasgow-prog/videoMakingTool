import { Scene } from "@/types/project";
import { parseTimeToSeconds as parseToSeconds } from "@/lib/sceneTiming";

function srtTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function vttTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

export function generateSrt(scenes: Scene[]): string {
  return scenes
    .map((scene, i) => {
      const start = srtTimestamp(parseToSeconds(scene.start));
      const end = srtTimestamp(parseToSeconds(scene.end));
      return `${i + 1}\n${start} --> ${end}\n${scene.subtitle}\n`;
    })
    .join("\n");
}

export function generateVtt(scenes: Scene[]): string {
  const body = scenes
    .map((scene) => {
      const start = vttTimestamp(parseToSeconds(scene.start));
      const end = vttTimestamp(parseToSeconds(scene.end));
      return `${start} --> ${end}\n${scene.subtitle}\n`;
    })
    .join("\n");
  return `WEBVTT\n\n${body}`;
}

export function generatePlainText(scenes: Scene[]): string {
  return scenes.map((scene) => scene.subtitle).join("\n");
}
