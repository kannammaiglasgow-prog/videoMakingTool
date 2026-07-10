interface ProgressBarProps {
  progress: number;
  variant?: "purple" | "green" | "red";
}

const VARIANT_CLASS: Record<NonNullable<ProgressBarProps["variant"]>, string> = {
  purple: "bg-gradient-to-r from-purple-500 to-violet-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
};

export default function ProgressBar({ progress, variant = "purple" }: ProgressBarProps) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
      <div
        className={`h-full rounded-full transition-all ${VARIANT_CLASS[variant]}`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}
