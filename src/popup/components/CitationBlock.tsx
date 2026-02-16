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
        <CopyButton text={plainText} />
      </div>

      <div className="bg-white rounded-md border border-ui-border p-3">
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
      </div>
    </div>
  );
}
