export function sceneCountForDuration(duration: number) {
  if (duration <= 15) return 3;
  if (duration <= 30) return 6;
  if (duration <= 45) return 7;
  return 8;
}

export function buildSceneTimestamps(duration: number, count: number) {
  const step = duration / count;
  return Array.from({ length: count }, (_, i) => ({
    start: Math.round(i * step),
    end: Math.round((i + 1) * step),
  }));
}

export function parseTimeToSeconds(time: string): number {
  const [m, s] = time.split(":").map(Number);
  return m * 60 + s;
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
