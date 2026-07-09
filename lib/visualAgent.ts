const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const IMAGE_MODEL = "gemini-2.5-flash-image";

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set.");
  return key;
}

export async function generateSceneImage(prompt: string): Promise<Buffer> {
  const key = getApiKey();
  const res = await fetch(`${API_BASE}/${IMAGE_MODEL}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${prompt}. Vertical 9:16 aspect ratio.` }] }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini image API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p: { inlineData?: { data: string } }) => p.inlineData);

  if (!imagePart?.inlineData?.data) {
    throw new Error("Gemini image API returned no image data.");
  }

  return Buffer.from(imagePart.inlineData.data, "base64");
}
