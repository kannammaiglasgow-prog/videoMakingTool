export function sceneCountForDuration(duration: number) {
  if (duration <= 15) return 3;
  if (duration <= 30) return 6;
  if (duration <= 45) return 7;
  if (duration <= 60) return 8;
  // Longer-form videos: aim for roughly a 15-18s average scene length so the
  // scene count (and the number of paid image/voiceover calls) stays sane.
  if (duration <= 120) return 10;
  if (duration <= 300) return 20;
  if (duration <= 480) return 28;
  return 34;
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
