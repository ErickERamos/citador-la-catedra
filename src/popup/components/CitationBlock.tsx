import { useState } from "react";

interface CitationBlockProps {
  label: string;
  badge?: string;
  /** Plain text version for copy */
  plainText: string;
  /** HTML version for display (optional, falls back to plainText) */
  html?: string;
  /** Display variant: 'card' (default) or 'row' */
  variant?: "card" | "row";
}

export default function CitationBlock({
  label,
  badge,
  plainText,
  html,
  variant = "card",
}: CitationBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older environments
      const textarea = document.createElement("textarea");
      textarea.value = plainText;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (variant === "row") {
    return (
      <div
        onClick={handleCopy}
        className={`group relative flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors border ${
          copied
            ? "border-action-cyan bg-action-cyan/5"
            : "border-bg-off-white hover:border-action-cyan/50 hover:bg-action-cyan/20"
        }`}
        title="Haz clic para copiar"
      >
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          <span className="font-brand font-bold text-charcoal/60 text-[10px] whitespace-nowrap min-w-[70px]">
            {label}
          </span>
          <p className="citation-text text-[13px] text-rich-black truncate font-medium flex-1">
            {plainText}
          </p>
        </div>

        {/* Hover overlay hint - Right aligned */}
        <div
          className={`absolute inset-0 flex items-center justify-end pr-3 bg-action-cyan/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-md ${
            copied ? "hidden" : ""
          } group-hover:text-action-cyan`}
        >
          <span className="text-xs font-semibold text-action-cyan bg-white px-3 py-1.5 rounded-md border border-action-cyan flex items-center gap-1.5 shadow-sm">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copiar
          </span>
        </div>
        
        {/* Copied feedback overlay - Right aligned */}
         <div
          className={`absolute inset-0 flex items-center justify-end pr-3 bg-action-cyan/10 opacity-0 transition-opacity pointer-events-none rounded-md ${
            copied ? "opacity-100" : "hidden"
          }`}
        >
           <span className="text-xs font-semibold text-action-cyan bg-white px-3 py-1.5 rounded-md shadow-sm border border-action-cyan flex items-center gap-1.5">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            ¡Copiado!
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-brand font-bold text-rich-black text-xs">
            {label}
          </span>
          {badge && (
            <span className="px-1.5 py-0.5 bg-accent-orange/15 text-accent-orange text-[9px] font-ui font-semibold uppercase rounded">
              {badge}
            </span>
          )}
        </div>
        
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-ui text-[10px] cursor-pointer
            border transition-all ${
              copied
                ? "border-action-cyan bg-action-cyan/10 text-action-cyan copy-success"
                : "border-ui-border text-charcoal/70 hover:border-action-cyan hover:text-action-cyan"
            }`}
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              ¡Copiado!
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copiar
            </>
          )}
        </button>
      </div>

      <div
        onClick={handleCopy}
        className={`rounded-md border p-3 cursor-pointer transition-colors group relative ${
          copied
            ? "border-action-cyan bg-action-cyan/5"
            : "border-bg-off-white hover:border-action-cyan/50 hover:bg-action-cyan/20"
        }`}
        title="Haz clic para copiar"
      >
        {html ? (
          <p
            className="citation-text text-[13px] text-rich-black leading-relaxed break-words"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p className="citation-text text-[13px] text-rich-black leading-relaxed break-words">
            {plainText}
          </p>
        )}

        {/* Hover overlay hint */}
        <div
          className={`absolute inset-0 flex items-center justify-center bg-action-cyan/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-md ${
            copied ? "hidden" : ""
          } group-hover:text-action-cyan`}
        >
          <span className="text-xs font-semibold text-action-cyan bg-white px-3 py-1.5 rounded-md border border-action-cyan flex items-center gap-1.5 shadow-sm">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copiar
          </span>
        </div>
        
        {/* Copied feedback overlay */}
         <div
          className={`absolute inset-0 flex items-center justify-center bg-action-cyan/10 opacity-0 transition-opacity pointer-events-none rounded-md ${
            copied ? "opacity-100" : "hidden"
          }`}
        >
           <span className="text-xs font-semibold text-action-cyan bg-white px-3 py-1.5 rounded-md shadow-sm border border-action-cyan flex items-center gap-1.5">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            ¡Copiado!
          </span>
        </div>
      </div>
    </div>
  );
}
