import type { CitationResult, CitationFormat, ReliabilityScore } from "../../lib/types";
import CitationBlock from "./CitationBlock";

interface CiteViewProps {
  citation: CitationResult;
  format: CitationFormat;
  onFormatChange: (format: CitationFormat) => void;
  reliability?: ReliabilityScore;
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
  reliability,
}: CiteViewProps) {
  return (
    <div className="p-4 space-y-5">
      {/* Reference list entry */}
      <CitationBlock
        label="Referencia"
        badge={FORMAT_LABELS[format]}
        rightContent={
          <div className="flex items-center justify-center gap-2 shrink-0">
            {reliability && (
              <div
                className="group relative"
                title={reliability.message}
              >
                <div
                  className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-md border font-body ${
                    reliability.color === "green"
                      ? "bg-green-100 border-green-300 text-green-700"
                      : reliability.color === "yellow"
                        ? "bg-yellow-100 border-yellow-300 text-yellow-700"
                        : "bg-red-100 border-red-300 text-red-700"
                  }`}
                >
                  <span className="text-sm font-bold">
                    {reliability.score.toFixed(1)}
                  </span>
                  <span className=" mx-auto text-xs font-semibold tracking-wide">
                    Fiabilidad de la fuente
                  </span>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 p-2.5 bg-rich-black text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none shadow-lg">
                  <div className="font-bold mb-1.5 border-b border-white/20 pb-1">
                    {reliability.color === "green"
                      ? "🟢 Fiabilidad Alta"
                      : reliability.color === "yellow"
                        ? "🟡 Fiabilidad Media"
                        : "🔴 Fiabilidad Baja"}
                  </div>
                  <p className="mb-2 text-white/90 leading-tight">
                    {reliability.message}
                  </p>
                  {reliability.reasons && reliability.reasons.length > 0 && (
                    <ul className="space-y-1 text-[11px] text-white/80">
                      {reliability.reasons.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className={reason.includes("-") ? "text-red-400" : "text-green-400"}>
                            {reason.includes("-") ? "✗" : "✓"}
                          </span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
            <div className="relative w-36">
              <select
                value={format}
                onChange={(e) => onFormatChange(e.target.value as CitationFormat)}
                className="w-full h-8 appearance-none bg-white border border-bg-off-white hover:border-action-cyan/50 rounded-md px-2.5 pr-7 text-xs text-rich-black font-ui focus:outline-none focus:border-action-cyan focus:ring-1 focus:ring-action-cyan/20 transition-all cursor-pointer flex items-center"
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
        }
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
