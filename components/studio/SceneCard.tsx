import { StudioScene } from "@/types/studio";

interface SceneCardProps {
  scene: StudioScene;
  active?: boolean;
  onClick?: () => void;
}

export default function SceneCard({ scene, active, onClick }: SceneCardProps) {
  return (
    <button
      onClick={onClick}
      className={
        "flex w-40 flex-shrink-0 flex-col gap-2 rounded-xl border p-2.5 text-left transition-colors " +
        (active
          ? "border-purple-500 bg-purple-950/30"
          : "border-slate-800 bg-slate-900/60 hover:border-slate-700")
      }
    >
      <div className="flex items-center justify-between text-[11px]">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 font-bold text-white">
          {scene.id}
        </span>
        <span className="text-slate-500">
          {scene.startTime} - {scene.endTime}
        </span>
      </div>
      <div className="flex h-16 items-center justify-center overflow-hidden rounded-lg bg-slate-800 text-2xl">
        {scene.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={scene.imageUrl} alt={scene.title} className="h-full w-full object-cover" />
        ) : (
          scene.thumbnail
        )}
      </div>
      <p className="text-xs font-semibold text-slate-100">{scene.title}</p>
      <p className="text-[11px] leading-snug text-slate-500">{scene.description}</p>
    </button>
  );
}
