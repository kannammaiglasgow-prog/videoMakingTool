import textToSpeech from "@google-cloud/text-to-speech";
import { Language, Voice } from "@/types/project";

const LANGUAGE_CODES: Record<Language, string> = {
  Tamil: "ta-IN",
  English: "en-US",
  Hindi: "hi-IN",
  Malayalam: "ml-IN",
  Telugu: "te-IN",
  Kannada: "kn-IN",
  Arabic: "ar-XA",
  French: "fr-FR",
  German: "de-DE",
  Spanish: "es-ES",
};

const VOICE_GENDER: Record<Voice, "MALE" | "FEMALE" | "NEUTRAL"> = {
  Male: "MALE",
  Female: "FEMALE",
  "News reader": "MALE",
  Narrator: "NEUTRAL",
};

let client: InstanceType<typeof textToSpeech.TextToSpeechClient> | null = null;

function getClient() {
  if (client) return client;

  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (credentialsJson) {
    client = new textToSpeech.TextToSpeechClient({ credentials: JSON.parse(credentialsJson) });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Falls back to the standard GOOGLE_APPLICATION_CREDENTIALS file-path
    // env var, which the client library reads automatically.
    client = new textToSpeech.TextToSpeechClient();
  } else {
    throw new Error(
      "Google Cloud TTS is not configured (set GOOGLE_APPLICATION_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS)."
    );
  }
  return client;
}

function pcmToWav(pcm: Buffer, sampleRate: number, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

export async function generateVoiceoverGoogle(
  text: string,
  voice: Voice,
  language: Language
): Promise<Buffer> {
  const sampleRateHertz = 24000;
  const [response] = await getClient().synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: LANGUAGE_CODES[language] ?? "en-US",
      ssmlGender: VOICE_GENDER[voice],
    },
    audioConfig: {
      audioEncoding: "LINEAR16",
      sampleRateHertz,
    },
  });

  if (!response.audioContent) {
    throw new Error("Google Cloud TTS returned no audio content.");
  }

  const pcm = Buffer.from(response.audioContent as Uint8Array);
  return pcmToWav(pcm, sampleRateHertz);
}
