"use client";

import { Download, Trash2 } from "lucide-react";
import { LanguageExportRow } from "@/types/studio";
import LanguageStatusRow from "@/components/studio/LanguageStatusRow";
import PrimaryButton from "@/components/studio/ui/PrimaryButton";
import SecondaryButton from "@/components/studio/ui/SecondaryButton";

interface LanguageExportTableProps {
  exports: LanguageExportRow[];
  onRetry: (projectId: string) => void;
  onDownloadAll: () => void;
  onClearCompleted: () => void;
  downloadingZip: boolean;
}

export default function LanguageExportTable({
  exports,
  onRetry,
  onDownloadAll,
  onClearCompleted,
  downloadingZip,
}: LanguageExportTableProps) {
  const anyCompleted = exports.some((e) => e.status === "completed");

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex items-center gap-2">
        <p className="text-xs font-bold tracking-wide text-purple-300">MULTI-LANGUAGE EXPORT</p>
        <span className="text-[11px] text-slate-500">(Voiceover &amp; Subtitles Only)</span>
      </div>

      {exports.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-500">
          Select languages and click Generate Video to see export status here.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-500">
                <th className="pb-2 font-medium">Language</th>
                <th className="pb-2 font-medium">Voice</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Preview</th>
                <th className="pb-2 font-medium">Download</th>
              </tr>
            </thead>
            <tbody>
              {exports.map((entry) => (
                <LanguageStatusRow key={entry.projectId} entry={entry} onRetry={onRetry} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-1">
        <PrimaryButton
          onClick={onDownloadAll}
          disabled={!anyCompleted}
          loading={downloadingZip}
          className="flex-1 py-2.5 text-sm"
        >
          {!downloadingZip && <Download className="h-4 w-4" />} Download All (ZIP)
        </PrimaryButton>
        <SecondaryButton onClick={onClearCompleted} disabled={!anyCompleted}>
          <Trash2 className="h-3.5 w-3.5" /> Clear Completed
        </SecondaryButton>
      </div>
    </div>
  );
}
