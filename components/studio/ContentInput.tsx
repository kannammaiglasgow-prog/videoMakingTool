"use client";

import { UploadCloud } from "lucide-react";

interface ContentInputProps {
  value: string;
  onChange: (value: string) => void;
  onImageChange: (dataUrl: string | undefined) => void;
}

export default function ContentInput({ value, onChange, onImageChange }: ContentInputProps) {
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onImageChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold tracking-wide text-slate-400">1. CONTENT INPUT</p>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={5000}
          placeholder="Enter your news, topic, story or content here..."
          className="h-32 w-full resize-none rounded-xl border border-slate-700 bg-slate-800/60 p-3 text-sm text-slate-100 outline-none transition-colors focus:border-purple-500"
        />
        <span className="absolute bottom-2 right-3 text-[11px] text-slate-500">
          {value.length} / 5000
        </span>
      </div>
      <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed border-purple-700/60 bg-purple-950/20 px-4 py-4 text-center transition-colors hover:bg-purple-950/30">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
        <UploadCloud className="h-5 w-5 text-purple-400" />
        <span className="text-sm font-medium text-purple-200">Upload Image / Thumbnail</span>
        <span className="text-[11px] text-slate-500">JPG, PNG, WEBP · Max 10MB</span>
      </label>
    </div>
  );
}
