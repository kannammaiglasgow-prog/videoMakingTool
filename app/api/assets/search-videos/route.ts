import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    const key = process.env.PEXELS_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "PEXELS_API_KEY is not configured." }, { status: 500 });
    }

    if (!query?.trim()) {
      return NextResponse.json({ error: "Query parameter is required." }, { status: 400 });
    }

    const searchUrl = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=12&orientation=portrait`;
    const res = await fetch(searchUrl, { headers: { Authorization: key } });
    if (!res.ok) {
      throw new Error(`Pexels API error (${res.status})`);
    }

    const data = await res.json();
    const results = (data.videos || []).map((v: any) => {
      const mp4Files = (v.video_files || []).filter((f: any) => f.file_type === "video/mp4");
      const previewFile = mp4Files.find((f: any) => f.quality === "sd") ?? mp4Files[0];
      const downloadFile = mp4Files.find((f: any) => f.quality === "hd") ?? mp4Files.find((f: any) => f.quality === "sd") ?? mp4Files[0];

      return {
        id: v.id,
        user: v.user?.name || "Unknown",
        url: v.url,
        previewUrl: previewFile?.link || "",
        downloadUrl: downloadFile?.link || "",
        image: v.image || "",
        duration: v.duration || 0,
      };
    });

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pexels video search failed." },
      { status: 500 }
    );
  }
}
