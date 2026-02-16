interface CopyButtonProps {
  onClick: () => void;
  copied: boolean;
  label?: string;
}

export default function CopyButton({ onClick, copied, label = "Copiar" }: CopyButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation(); // Prevent triggering parent click if any
        onClick();
      }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-ui text-[10px] cursor-pointer
        border transition-all ${
          copied
            ? "border-action-cyan bg-action-cyan/10 text-action-cyan copy-success"
            : "border-ui-border text-charcoal/70 hover:border-action-cyan hover:text-action-cyan"
        }`}
    >
      {copied ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
      {copied ? "¡Copiado!" : label}
    </button>
  );
}
