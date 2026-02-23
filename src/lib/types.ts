export type SourceType = "webpage" | "article" | "news" | "blog" | "unknown";

export interface AuthorInfo {
  name: string;
  type: "person" | "organization";
}

export interface ReliabilityScore {
  score: number;
  color: "green" | "yellow" | "red";
  message: string;
}

export interface PageMetadata {
  title: string;
  authors: AuthorInfo[];
  datePublished: string | null;
  siteName: string | null;
  url: string;
  sourceType: SourceType;
  reliability?: ReliabilityScore;
}

export type AuthorDisplayMode = "person" | "institutional";

export type CitationFormat =
  | "apa7"
  | "mla"
  | "chicago"
  | "harvard"
  | "une-iso-690"
  | "ieee"
  | "vancouver"
  | "iso-690"
  | "latino";

export interface CitationResult {
  /** Full APA 7 reference list entry (plain text) */
  referenceList: string;
  /** Full APA 7 reference list entry (HTML with <em> for italics) */
  referenceListHtml: string;
  /** Parenthetical in-text citation, e.g. "(Apellido, 2024)" */
  parenthetical: string;
  /** Narrative in-text citation, e.g. "Apellido (2024)" */
  narrative: string;
}

export interface ExtractMessage {
  action: "extract-metadata";
}

export interface ExtractResponse {
  success: boolean;
  data?: PageMetadata;
  error?: string;
}
