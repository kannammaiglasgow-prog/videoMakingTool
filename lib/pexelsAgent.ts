const API_BASE = "https://api.pexels.com/videos/search";

function getApiKey() {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error("PEXELS_API_KEY is not set.");
  return key;
}

interface PexelsVideoFile {
  quality: string;
  file_type: string;
  width: number;
  height: number;
  link: string;
}

interface PexelsVideo {
  id: number;
  url: string;
  user: { name: string };
  video_files: PexelsVideoFile[];
}

export interface PexelsSceneVideo {
  buffer: Buffer;
  credit: string;
}

export async function searchAndDownloadSceneVideo(query: string): Promise<PexelsSceneVideo> {
  const key = getApiKey();
  const searchUrl = `${API_BASE}?query=${encodeURIComponent(query)}&per_page=5&orientation=portrait`;

  const res = await fetch(searchUrl, { headers: { Authorization: key } });
  if (!res.ok) {
    throw new Error(`Pexels API error (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { videos: PexelsVideo[] };
  const video = data.videos?.[0];
  if (!video) {
    throw new Error(`No Pexels video found for "${query}".`);
  }

  const mp4Files = video.video_files.filter((f) => f.file_type === "video/mp4");
  const chosen =
    mp4Files.find((f) => f.quality === "hd") ?? mp4Files.find((f) => f.quality === "sd") ?? mp4Files[0];
  if (!chosen) {
    throw new Error(`Pexels video ${video.id} has no downloadable mp4.`);
  }

  const videoRes = await fetch(chosen.link);
  if (!videoRes.ok) {
    throw new Error(`Failed to download Pexels video ${video.id} (${videoRes.status}).`);
  }

  const arrayBuffer = await videoRes.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    credit: `Video by ${video.user.name} on Pexels (${video.url})`,
  };
}
