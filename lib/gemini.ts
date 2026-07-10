const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const TEXT_MODEL = "gemini-2.5-flash";

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set.");
  return key;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const RETRYABLE_STATUS = new Set([429, 503]);
const MAX_ATTEMPTS = 4;

/**
 * fetch() with retry/backoff for Gemini's transient 429/503 errors, shared by
 * the text, image, and TTS callers so an overload doesn't immediately bounce
 * every request out to the mock/error fallback.
 */
export async function fetchGeminiWithRetry(url: string, body: string): Promise<Response> {
  let res: Response | null = null;
  let errText = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (res.ok) return res;

    errText = await res.text();
    const shouldRetry = RETRYABLE_STATUS.has(res.status) && attempt < MAX_ATTEMPTS;
    if (!shouldRetry) break;

    // Gemini is transiently overloaded (503) or rate-limited (429) — back off
    // and retry a few times before giving up and falling back to mock output.
    await sleep(1000 * 2 ** (attempt - 1));
  }

  throw new Error(`Gemini API error (${res?.status}): ${errText}`);
}

export async function generateJSON<T>(
  prompt: string,
  responseSchema: object,
  maxOutputTokens = 8192
): Promise<T> {
  const key = getApiKey();
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      maxOutputTokens,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const res = await fetchGeminiWithRetry(`${API_BASE}/${TEXT_MODEL}:generateContent?key=${key}`, body);

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
