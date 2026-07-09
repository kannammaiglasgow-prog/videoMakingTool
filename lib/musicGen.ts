import { MusicStyle } from "@/types/project";
import { runFfmpeg } from "@/lib/ffmpegRunner";

interface MusicRecipe {
  frequencies: number[];
  tremolo?: string;
  vibrato?: string;
}

const RECIPES: Record<Exclude<MusicStyle, "Auto" | "No music">, MusicRecipe> = {
  Emotional: { frequencies: [220, 277.18, 329.63] },
  Funny: { frequencies: [392, 523.25], tremolo: "tremolo=f=6:d=0.5" },
  Suspense: { frequencies: [55, 82.41], tremolo: "tremolo=f=3:d=0.7" },
  News: { frequencies: [261.63, 329.63], tremolo: "tremolo=f=2:d=0.3" },
  Cinematic: { frequencies: [130.81, 164.81, 196.0, 261.63] },
};

function resolveStyle(style: MusicStyle, tone: string): Exclude<MusicStyle, "Auto" | "No music"> {
  if (style !== "Auto") return style as Exclude<MusicStyle, "Auto" | "No music">;
  const t = tone.toLowerCase();
  if (t.includes("funny")) return "Funny";
  if (t.includes("emotional") || t.includes("supportive")) return "Emotional";
  if (t.includes("serious") || t.includes("documentary") || t.includes("against")) return "News";
  if (t.includes("motivational")) return "Cinematic";
  return "Cinematic";
}

const VOLUME_GAIN: Record<"low" | "medium" | "high", number> = {
  low: 0.12,
  medium: 0.22,
  high: 0.35,
};

export async function generateBackgroundMusic(
  dir: string,
  style: MusicStyle,
  tone: string,
  volume: "low" | "medium" | "high",
  duration: number
): Promise<boolean> {
  if (style === "No music") return false;

  const recipe = RECIPES[resolveStyle(style, tone)];
  const gain = VOLUME_GAIN[volume] ?? 0.15;
  const fadeOutStart = Math.max(0, duration - 1.5);

  const inputArgs = recipe.frequencies.flatMap((f) => [
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=${f}:duration=${duration}`,
  ]);

  const mixInputs = recipe.frequencies.map((_, i) => `[${i}:a]`).join("");
  const postFilters = [recipe.tremolo, recipe.vibrato].filter(Boolean).join(",");
  const filterChain =
    `${mixInputs}amix=inputs=${recipe.frequencies.length}:duration=longest[mix];` +
    `[mix]${postFilters ? postFilters + "," : ""}afade=t=in:st=0:d=1.5,afade=t=out:st=${fadeOutStart}:d=1.5,volume=${gain}[out]`;

  await runFfmpeg(
    [...inputArgs, "-filter_complex", filterChain, "-map", "[out]", "-y", "music.wav"],
    dir
  );

  return true;
}
