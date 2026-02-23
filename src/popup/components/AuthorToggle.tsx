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
    <div className="flex items-center gap-1">
      {options.map((opt, i) => (
        <span key={opt.id} className="flex items-center gap-1">
          {i > 0 && (
            <span className="text-charcoal/30 text-[10px] font-ui" aria-hidden>
              
            </span>
          )}
          <button
            onClick={() => onChange(opt.id)}
            className={`tab-link text-ui py-2.5 px-3 cursor-pointer transition-colors ${
              mode === opt.id
                ? "active text-primary-blue"
                : "text-charcoal/60 hover:text-charcoal"
            }`}
          >
            {opt.label}
          </button>
        </span>
      ))}
    </div>
  );
}
