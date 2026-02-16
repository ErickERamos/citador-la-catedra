import type { AuthorDisplayMode } from "../../lib/types";

interface AuthorToggleProps {
  mode: AuthorDisplayMode;
  onChange: (mode: AuthorDisplayMode) => void;
}

export default function AuthorToggle({ mode, onChange }: AuthorToggleProps) {
  const options: { id: AuthorDisplayMode; label: string }[] = [
    { id: "person", label: "Persona" },
    { id: "institutional", label: "Institucional" },
  ];

  return (
    <div className="flex rounded-md overflow-hidden border border-ui-border">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`flex-1 py-1.5 px-3 text-ui text-[10px] cursor-pointer transition-all ${
            mode === opt.id
              ? "bg-primary-blue text-white"
              : "bg-bg-off-white text-charcoal hover:bg-ui-border/50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
