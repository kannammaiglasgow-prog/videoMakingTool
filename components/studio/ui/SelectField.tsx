interface SelectFieldProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export default function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-purple-500"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
