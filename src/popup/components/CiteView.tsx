import type { CitationResult, CitationFormat } from "../../lib/types";
import CitationBlock from "./CitationBlock";

interface CiteViewProps {
  citation: CitationResult;
  format: CitationFormat;
  onFormatChange: (format: CitationFormat) => void;
}

const FORMAT_LABELS: Record<CitationFormat, string> = {
  apa7: "APA 7",
  mla: "MLA",
  chicago: "Chicago",
  harvard: "Harvard",
  "une-iso-690": "UNE-ISO 690",
  ieee: "IEEE",
  vancouver: "Vancouver",
  "iso-690": "ISO 690",
  latino: "Latino",
};

export default function CiteView({
  citation,
  format,
  onFormatChange,
}: CiteViewProps) {
  return (
    <div className="p-4 space-y-5">
      {/* Format Selector */}
      <div>
        <label className="text-ui text-[10px] text-charcoal/60 mb-1.5 block">
          Formato
        </label>
        <div className="relative">
          <select
            value={format}
            onChange={(e) => onFormatChange(e.target.value as CitationFormat)}
            className="w-full h-9 appearance-none bg-white border border-bg-off-white hover:border-action-cyan/50 rounded-md px-3 text-xs text-rich-black font-ui focus:outline-none focus:border-action-cyan focus:ring-1 focus:ring-action-cyan/20 transition-all cursor-pointer flex items-center"
          >
            {Object.entries(FORMAT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-charcoal/40">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Reference list entry */}
      <CitationBlock
        label="Referencia"
        badge={FORMAT_LABELS[format]}
        plainText={citation.referenceList}
        html={citation.referenceListHtml}
        variant="card"
      />

      {/* Divider */}
      <hr className="border-ui-border" />

      {/* In-text citations (list rows) */}
      <div className="space-y-1">
        <CitationBlock
          label={format === "ieee" || format === "vancouver" || format === "latino" ? "Cita" : "Parentética"}
          plainText={citation.parenthetical}
          variant="row"
        />

        {format !== "ieee" && format !== "vancouver" && format !== "latino" && (
          <CitationBlock
            label="Narrativa"
            plainText={citation.narrative}
            variant="row"
          />
        )}
      </div>
    </div>
  );
}
