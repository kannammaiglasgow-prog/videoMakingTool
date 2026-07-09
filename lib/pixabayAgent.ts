const API_BASE = "https://pixabay.com/api/videos/";

function getApiKey() {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) throw new Error("PIXABAY_API_KEY is not set.");
  return key;
}

interface PixabayVideoSize {
  url: string;
  width: number;
  height: number;
}

interface PixabayHit {
  id: number;
  user: string;
  pageURL: string;
  videos: {
    large?: PixabayVideoSize;
    medium?: PixabayVideoSize;
    small?: PixabayVideoSize;
    tiny?: PixabayVideoSize;
  };
}

export interface PixabaySceneVideo {
  buffer: Buffer;
  credit: string;
}

export async function searchAndDownloadSceneVideo(query: string): Promise<PixabaySceneVideo> {
  const key = getApiKey();
  const searchUrl = `${API_BASE}?key=${key}&q=${encodeURIComponent(query)}&per_page=5&safesearch=true`;

  const res = await fetch(searchUrl);
  if (!res.ok) {
    throw new Error(`Pixabay API error (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { hits: PixabayHit[] };
  const hit = data.hits?.[0];
  if (!hit) {
    throw new Error(`No Pixabay video found for "${query}".`);
  }

  // Prefer vertical/portrait-friendly sizes; fall back down the size ladder.
  const candidates = [hit.videos.medium, hit.videos.large, hit.videos.small, hit.videos.tiny];
  const chosen = candidates.find((v): v is PixabayVideoSize => Boolean(v?.url));
  if (!chosen) {
    throw new Error(`Pixabay video ${hit.id} has no downloadable file.`);
  }

  const videoRes = await fetch(chosen.url);
  if (!videoRes.ok) {
    throw new Error(`Failed to download Pixabay video ${hit.id} (${videoRes.status}).`);
  }

  const arrayBuffer = await videoRes.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    credit: `Video by ${hit.user} on Pixabay (${hit.pageURL})`,
  };
}
