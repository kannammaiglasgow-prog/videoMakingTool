import { Voice } from "@/types/project";
import { fetchGeminiWithRetry } from "@/lib/gemini";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

const VOICE_MAP: Record<Voice, string> = {
  Male: "Puck",
  Female: "Kore",
  "News reader": "Charon",
  Narrator: "Fenrir",
};

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set.");
  return key;
}

function pcmToWav(pcm: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

export async function generateVoiceover(text: string, voice: Voice): Promise<Buffer> {
  const key = getApiKey();
  const voiceName = VOICE_MAP[voice] ?? "Kore";

  const body = JSON.stringify({
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName } },
      },
    },
  });
  const res = await fetchGeminiWithRetry(`${API_BASE}/${TTS_MODEL}:generateContent?key=${key}`, body);

  const data = await res.json();
  const part = data?.candidates?.[0]?.content?.parts?.[0];
  const inline = part?.inlineData;

  if (!inline?.data) {
    throw new Error("Gemini TTS API returned no audio data.");
  }

  const pcm = Buffer.from(inline.data, "base64");
  const rateMatch = /rate=(\d+)/.exec(inline.mimeType ?? "");
  const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;

  return pcmToWav(pcm, sampleRate);
}
