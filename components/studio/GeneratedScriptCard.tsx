interface GeneratedScriptCardProps {
  script: string;
  language: string;
  duration: number;
  sceneCount: number;
}

export default function GeneratedScriptCard({
  script,
  language,
  duration,
  sceneCount,
}: GeneratedScriptCardProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-slate-300">
        Generated Script <span className="text-slate-500">({language} - Default)</span>
      </p>
      <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-100">
        {script}
      </div>
      <div className="flex gap-6 text-xs text-slate-400">
        <span>
          Total Duration: <span className="font-semibold text-slate-200">{duration}s</span>
        </span>
        <span>
          Total Scenes: <span className="font-semibold text-slate-200">{sceneCount}</span>
        </span>
      </div>
    </div>
  );
}
