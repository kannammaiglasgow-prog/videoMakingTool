const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const TEXT_MODEL = "gemini-2.5-flash";

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set.");
  return key;
}

export async function generateJSON<T>(prompt: string, responseSchema: object): Promise<T> {
  const key = getApiKey();
  const res = await fetch(`${API_BASE}/${TEXT_MODEL}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
        maxOutputTokens: 8192,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;

  if (candidate?.finishReason === "MAX_TOKENS") {
    throw new Error("Gemini response was truncated (hit max output tokens).");
  }
  if (!text) throw new Error("Gemini API returned no content.");

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Gemini API returned malformed JSON.");
  }
}
