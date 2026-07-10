"use client";

import { useState } from "react";
import { ArrowRight, Edit3, PlayCircle } from "lucide-react";
import { StudioScene } from "@/types/studio";
import SceneCard from "@/components/studio/SceneCard";
import SecondaryButton from "@/components/studio/ui/SecondaryButton";
import PrimaryButton from "@/components/studio/ui/PrimaryButton";

interface SceneTimelineProps {
  scenes: StudioScene[];
  totalDuration: number;
  onNextStep?: () => void;
  nextDisabled?: boolean;
}

export default function SceneTimeline({
  scenes,
  totalDuration,
  onNextStep,
  nextDisabled,
}: SceneTimelineProps) {
  const [activeScene, setActiveScene] = useState(1);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-800 bg-slate-950/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-wide text-purple-400">SCENE TIMELINE</p>
          <p className="text-[11px] text-slate-500">Master Video – Same for All Languages</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Total Duration: <span className="font-semibold text-slate-200">{totalDuration}s</span>
          </span>
          <SecondaryButton className="py-2 text-xs">
            <Edit3 className="h-3.5 w-3.5" /> Edit Timeline
          </SecondaryButton>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {scenes.map((scene) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            active={scene.id === activeScene}
            onClick={() => setActiveScene(scene.id)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
        <p className="text-[11px] text-slate-500">
          All languages use the same video, images, music, effects and timeline. Only voiceover
          and subtitles change.
        </p>
        <div className="flex gap-3">
          <SecondaryButton className="py-2 text-xs">
            <PlayCircle className="h-3.5 w-3.5" /> Preview Master Video
          </SecondaryButton>
          <PrimaryButton onClick={onNextStep} disabled={nextDisabled} className="py-2 text-xs">
            Next: Assets <ArrowRight className="h-3.5 w-3.5" />
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
