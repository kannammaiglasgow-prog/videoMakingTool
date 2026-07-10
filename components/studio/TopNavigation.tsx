"use client";

import { Bell, Check, Clapperboard } from "lucide-react";

const STEPS = [
  "Input",
  "AI Plan",
  "Assets",
  "Timeline",
  "Voice & Sub",
  "Preview",
  "Render",
  "Rendering",
  "Export",
];

export default function TopNavigation({ activeStep = 0 }: { activeStep?: number }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/80 px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-violet-600">
          <Clapperboard className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-white">AI Shorts Studio</p>
          <p className="text-xs text-slate-400">AI YouTube Shorts Generator</p>
        </div>
      </div>

      <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
        {STEPS.map((step, i) => {
          const isActive = i === activeStep;
          const isDone = i < activeStep;
          return (
            <div key={step} className="flex items-center gap-1 sm:gap-2">
              <div
                className={
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors " +
                  (isActive
                    ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white"
                    : isDone
                      ? "text-emerald-400"
                      : "text-slate-500")
                }
              >
                <span
                  className={
                    "flex h-5 w-5 items-center justify-center rounded-full text-[11px] " +
                    (isActive ? "bg-white/20" : isDone ? "bg-emerald-500/20" : "bg-slate-800")
                  }
                >
                  {isDone ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{step}</span>
              </div>
              {i < STEPS.length - 1 && <span className="text-slate-700">›</span>}
            </div>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <button className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800">
          Save Project
        </button>
        <button className="relative rounded-full border border-slate-700 bg-slate-800/60 p-2 text-slate-300 hover:bg-slate-800">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">
            3
          </span>
        </button>
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-violet-700" />
      </div>
    </header>
  );
}
