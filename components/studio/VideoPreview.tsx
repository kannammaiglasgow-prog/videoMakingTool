"use client";

import { useState } from "react";
import { Maximize2, Pause, Play, SkipBack, SkipForward } from "lucide-react";

const BARS = Array.from({ length: 48 }, (_, i) => 8 + Math.round(Math.sin(i * 0.7) * 6 + 10));

export default function VideoPreview() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-xs font-bold tracking-wider text-purple-400">PREVIEW (9:16)</p>

      <div className="relative mx-auto aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-2xl border border-slate-700 bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-900 to-black" />

        <div className="absolute left-3 top-3 flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-[10px] font-bold text-white">
          BREAKING
          <br />
          NEWS
        </div>

        <div className="absolute inset-x-0 bottom-24 flex flex-col items-center gap-1 px-4 text-center">
          <p className="text-2xl font-black leading-tight text-yellow-400 drop-shadow-lg">
            INDIA WINS
          </p>
          <p className="text-lg font-black leading-tight text-white drop-shadow-lg">
            T20 WORLD CUP 2024
          </p>
          <p className="mt-1 text-xs font-bold text-slate-200">A HISTORIC VICTORY!</p>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/90 to-transparent p-3">
          <div className="flex h-6 items-end gap-[2px]">
            {BARS.map((h, i) => (
              <span
                key={i}
                className="w-[2px] rounded-full bg-purple-400/70"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-[47%] rounded-full bg-purple-500" />
          </div>
          <p className="text-[10px] text-slate-300">0:14 / 0:30</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button className="text-slate-400 hover:text-white">
          <SkipBack className="h-4 w-4" />
        </button>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-violet-600 text-white"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>
        <button className="text-slate-400 hover:text-white">
          <SkipForward className="h-4 w-4" />
        </button>
        <button className="text-slate-400 hover:text-white">
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
