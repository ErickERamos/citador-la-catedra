import { useState } from "react";
import CopyButton from "./CopyButton";

interface CitationBlockProps {
  label: string;
  badge?: string;
  /** Plain text version for copy */
  plainText: string;
  /** HTML version for display (optional, falls back to plainText) */
  html?: string;
}

export default function CitationBlock({
  label,
  badge,
  plainText,
  html,
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
        <CopyButton onClick={handleCopy} copied={copied} />
      </div>

      <div
        onClick={handleCopy}
        className={`bg-white rounded-md border p-3 cursor-pointer transition-colors group relative ${
          copied
            ? "border-action-cyan bg-action-cyan/5"
            : "border-ui-border hover:border-action-cyan/50 hover:bg-ui-background/30"
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
        <div className={`absolute inset-0 flex items-center justify-center bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${copied ? "hidden" : ""}`}>
           <span className="text-xs font-semibold text-action-cyan bg-white px-2 py-1 rounded shadow-sm border border-ui-border">
             Copiar
           </span>
        </div>
      </div>
    </div>
  );
}
