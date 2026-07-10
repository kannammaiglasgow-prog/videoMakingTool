interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function CheckboxField({ label, checked, onChange, disabled }: CheckboxFieldProps) {
  return (
    <label
      className={
        "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition-colors " +
        (checked
          ? "border-purple-600/60 bg-purple-950/40 text-purple-100"
          : "border-slate-700 bg-slate-800/40 text-slate-300") +
        (disabled ? " cursor-not-allowed opacity-40" : " cursor-pointer hover:border-slate-600")
      }
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded accent-purple-600"
      />
      {label}
    </label>
  );
}
