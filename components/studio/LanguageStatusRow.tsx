"use client";

import { AlertTriangle, CheckCircle2, Download, Play } from "lucide-react";
import { LanguageExport } from "@/types/studio";
import ProgressBar from "@/components/studio/ui/ProgressBar";

interface LanguageStatusRowProps {
  entry: LanguageExport;
  onRetry: (languageCode: string) => void;
}

export default function LanguageStatusRow({ entry, onRetry }: LanguageStatusRowProps) {
  const canPreview = entry.status === "completed" || entry.status === "rendering";
  const canDownload = entry.status === "completed";

  return (
    <tr className="border-b border-slate-800 last:border-0">
      <td className="py-3 pr-3">
        <p className="text-sm font-medium text-slate-100">
          {entry.flag} {entry.languageName}
        </p>
        <p className="text-xs text-slate-500">{entry.nativeName}</p>
      </td>
      <td className="py-3 pr-3 text-xs text-slate-300">{entry.voiceName}</td>
      <td className="py-3 pr-3">
        {entry.status === "completed" && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Completed
          </span>
        )}
        {entry.status === "rendering" && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-purple-300">Rendering {entry.progress}%</span>
            <ProgressBar progress={entry.progress} />
          </div>
        )}
        {entry.status === "queued" && <span className="text-xs text-slate-500">Queued</span>}
        {entry.status === "translating" && (
          <span className="text-xs font-medium text-purple-300">Translating...</span>
        )}
        {entry.status === "generating-voice" && (
          <span className="text-xs font-medium text-purple-300">Generating Voice...</span>
        )}
        {entry.status === "generating-subtitles" && (
          <span className="text-xs font-medium text-purple-300">Generating Subtitles...</span>
        )}
        {entry.status === "failed" && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Failed
            </span>
            <button
              onClick={() => onRetry(entry.languageCode)}
              className="rounded-full border border-red-800 px-2 py-0.5 text-[11px] font-medium text-red-300 hover:bg-red-950"
            >
              Retry
            </button>
          </div>
        )}
      </td>
      <td className="py-3 pr-3">
        <button
          disabled={!canPreview}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-white disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600"
        >
          <Play className="ml-0.5 h-3 w-3" />
        </button>
      </td>
      <td className="py-3">
        <button
          disabled={!canDownload}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}
