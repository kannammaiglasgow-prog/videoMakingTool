"use client";

import { LanguageOption } from "@/types/studio";
import CheckboxField from "@/components/studio/ui/CheckboxField";

interface MultiLanguageSelectorProps {
  languages: LanguageOption[];
  onToggle: (code: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  keepSameVoice: boolean;
  onKeepSameVoiceChange: (value: boolean) => void;
}

export default function MultiLanguageSelector({
  languages,
  onToggle,
  onSelectAll,
  onClearAll,
  keepSameVoice,
  onKeepSameVoiceChange,
}: MultiLanguageSelectorProps) {
  const selectedCount = languages.filter((l) => l.selected).length;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-purple-800/40 bg-purple-950/20 p-4">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold tracking-wide text-purple-200">
          3. MULTI-LANGUAGE VOICEOVER EXPORT
        </p>
        <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white">
          NEW
        </span>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-400">
        Choose multiple languages. The same video, visuals, music, effects and timeline will be
        reused. Only the voiceover and subtitles will change.
      </p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Select Languages <span className="text-slate-600">(Choose multiple)</span>
        </span>
        <div className="flex items-center gap-3 text-xs">
          <button onClick={onSelectAll} className="font-medium text-purple-400 hover:text-purple-300">
            Select All
          </button>
          <span className="text-slate-700">|</span>
          <button onClick={onClearAll} className="font-medium text-purple-400 hover:text-purple-300">
            Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {languages.map((lang) => (
          <CheckboxField
            key={lang.code}
            label={`${lang.flag} ${lang.name}`}
            checked={lang.selected}
            onChange={() => onToggle(lang.code)}
          />
        ))}
      </div>

      <p className="text-xs font-medium text-purple-300">
        {selectedCount} language{selectedCount === 1 ? "" : "s"} selected
      </p>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
        <input
          type="radio"
          checked={keepSameVoice}
          onChange={() => onKeepSameVoiceChange(true)}
          className="h-3.5 w-3.5 accent-purple-600"
        />
        Keep Same Voice Character
      </label>
    </div>
  );
}
