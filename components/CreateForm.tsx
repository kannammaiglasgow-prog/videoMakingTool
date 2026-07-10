"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Audience,
  Language,
  MusicStyle,
  Platform,
  ProjectSettings,
  Style,
  Tone,
  VideoLength,
  VisualStyle,
  Voice,
} from "@/types/project";

const LENGTHS: VideoLength[] = [15, 30, 45, 60, 120, 300, 480, 600];

function formatLength(seconds: VideoLength): string {
  if (seconds < 60) return `${seconds} sec`;
  const minutes = seconds / 60;
  return `${minutes} min`;
}
const LANGUAGES: Language[] = [
  "Tamil",
  "English",
  "Hindi",
  "Malayalam",
  "Telugu",
  "Kannada",
  "Arabic",
  "French",
  "German",
  "Spanish",
];
const AUDIENCES: Audience[] = ["General public", "Students", "Parents", "Professionals", "Kids"];
const TONES: Tone[] = [
  "Neutral",
  "Supportive",
  "Against",
  "Funny",
  "Serious",
  "Emotional",
  "Motivational",
  "Documentary",
];
const STYLES: Style[] = ["Breaking news", "Storytelling", "Comedy", "Educational", "Cinematic", "Documentary"];
const VOICES: Voice[] = ["Male", "Female", "News reader", "Narrator"];
const MUSIC_STYLES: MusicStyle[] = ["Auto", "No music", "Emotional", "Funny", "Suspense", "News", "Cinematic"];
const VISUAL_STYLES: VisualStyle[] = ["Realistic", "AI art", "3D", "Documentary", "Cinematic", "Cartoon"];
const PLATFORMS: Platform[] = ["YouTube Shorts", "YouTube Video", "Instagram Reel", "TikTok"];

const DEFAULT_SETTINGS: ProjectSettings = {
  duration: 30,
  language: "English",
  audience: "General public",
  tone: "Neutral",
  style: "Storytelling",
  voice: "Narrator",
  music: "Auto",
  visualStyle: "Cinematic",
  platform: "YouTube Shorts",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      {children}
    </label>
  );
}

const selectClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

export default function CreateForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined);
  const [settings, setSettings] = useState<ProjectSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [multiLanguage, setMultiLanguage] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>(["English", "Tamil"]);
  const [progress, setProgress] = useState<string | null>(null);

  function toggleLanguage(lang: Language) {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  }

  function updateSetting<K extends keyof ProjectSettings>(key: K, value: ProjectSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!text.trim()) {
      setError("Please enter some text or topic to generate a video.");
      return;
    }

    if (multiLanguage && selectedLanguages.length === 0) {
      setError("Select at least one language.");
      return;
    }

    setLoading(true);
    try {
      if (multiLanguage) {
        setProgress(
          `Generating script and scenes for ${selectedLanguages.length} language(s)...`
        );
        const res = await fetch("/api/generate/multi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, imageDataUrl, settings, languages: selectedLanguages }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Generation failed.");
        }

        const { projects } = (await res.json()) as { projects: { id: string }[] };
        for (const project of projects) {
          localStorage.setItem(`project:${project.id}`, JSON.stringify(project));
        }
        router.push(`/languages/${projects[0].id}`);
      } else {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, imageDataUrl, settings }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Generation failed.");
        }

        const project = await res.json();
        localStorage.setItem(`project:${project.id}`, JSON.stringify(project));
        router.push(`/preview/${project.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-3xl flex-col gap-6">
      <Field label="Text, news, or topic">
        <textarea
          className={selectClass + " min-h-32 resize-y"}
          placeholder="Paste your text, news article, or describe the topic..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </Field>

      <Field label="Upload an image (optional)">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="text-sm"
        />
        {imageDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageDataUrl} alt="Uploaded preview" className="mt-2 h-32 w-auto rounded-md object-cover" />
        )}
      </Field>

      <div className="rounded-md border border-zinc-300 p-3 dark:border-zinc-700">
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={multiLanguage}
            onChange={(e) => setMultiLanguage(e.target.checked)}
          />
          Generate in multiple languages (one click)
        </label>
        {multiLanguage && (
          <div className="mt-3 flex flex-wrap gap-3">
            {LANGUAGES.map((lang) => (
              <label
                key={lang}
                className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <input
                  type="checkbox"
                  checked={selectedLanguages.includes(lang)}
                  onChange={() => toggleLanguage(lang)}
                />
                {lang}
              </label>
            ))}
          </div>
        )}
        {multiLanguage && (
          <p className="mt-2 text-xs text-zinc-500">
            Images/video are generated once and reused across every selected language; only the
            script and voiceover are regenerated per language.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Video length">
          <select
            className={selectClass}
            value={settings.duration}
            onChange={(e) => updateSetting("duration", Number(e.target.value) as VideoLength)}
          >
            {LENGTHS.map((v) => (
              <option key={v} value={v}>
                {formatLength(v)}
              </option>
            ))}
          </select>
        </Field>

        {!multiLanguage && (
          <Field label="Language">
            <select
              className={selectClass}
              value={settings.language}
              onChange={(e) => updateSetting("language", e.target.value as Language)}
            >
              {LANGUAGES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Target audience">
          <select
            className={selectClass}
            value={settings.audience}
            onChange={(e) => updateSetting("audience", e.target.value as Audience)}
          >
            {AUDIENCES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tone">
          <select
            className={selectClass}
            value={settings.tone}
            onChange={(e) => updateSetting("tone", e.target.value as Tone)}
          >
            {TONES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Style">
          <select
            className={selectClass}
            value={settings.style}
            onChange={(e) => updateSetting("style", e.target.value as Style)}
          >
            {STYLES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Voice">
          <select
            className={selectClass}
            value={settings.voice}
            onChange={(e) => updateSetting("voice", e.target.value as Voice)}
          >
            {VOICES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Music style">
          <select
            className={selectClass}
            value={settings.music}
            onChange={(e) => updateSetting("music", e.target.value as MusicStyle)}
          >
            {MUSIC_STYLES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Visual style">
          <select
            className={selectClass}
            value={settings.visualStyle}
            onChange={(e) => updateSetting("visualStyle", e.target.value as VisualStyle)}
          >
            {VISUAL_STYLES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Platform">
          <select
            className={selectClass}
            value={settings.platform}
            onChange={(e) => updateSetting("platform", e.target.value as Platform)}
          >
            {PLATFORMS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {progress && <p className="text-sm text-zinc-600 dark:text-zinc-400">{progress}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {loading ? "Generating..." : multiLanguage ? "Generate all languages" : "Generate"}
      </button>
    </form>
  );
}
