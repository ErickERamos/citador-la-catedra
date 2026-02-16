import type { AuthorDisplayMode, CitationResult } from "../../lib/types";
import AuthorToggle from "./AuthorToggle";
import CitationBlock from "./CitationBlock";

interface CiteViewProps {
  citation: CitationResult;
  authorMode: AuthorDisplayMode;
  onAuthorModeChange: (mode: AuthorDisplayMode) => void;
}

export default function CiteView({
  citation,
  authorMode,
  onAuthorModeChange,
}: CiteViewProps) {
  return (
    <div className="p-4 space-y-5">
      {/* Author type toggle */}
      <div>
        <label className="text-ui text-[10px] text-charcoal/60 mb-1.5 block">
          Tipo de autor
        </label>
        <AuthorToggle mode={authorMode} onChange={onAuthorModeChange} />
      </div>

      {/* Reference list entry */}
      <CitationBlock
        label="Entrada de lista de referencias"
        badge="APA 7"
        plainText={citation.referenceList}
        html={citation.referenceListHtml}
      />

      {/* Divider */}
      <hr className="border-ui-border" />

      {/* Parenthetical citation */}
      <CitationBlock
        label="Cita parentética"
        plainText={citation.parenthetical}
      />

      {/* Narrative citation */}
      <CitationBlock
        label="Cita narrativa"
        plainText={citation.narrative}
      />
    </div>
  );
}
