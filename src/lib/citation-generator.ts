import type {
  PageMetadata,
  AuthorDisplayMode,
  CitationResult,
} from "./types";

/**
 * APA 7th Edition Citation Generator.
 *
 * Produces:
 * - Reference list entry: Author. (Year). *Title*. Site Name. URL
 * - Parenthetical citation: (Author, Year)
 */
export class CitationGenerator {
  /**
   * Generate both citation formats from extracted metadata.
   */
  static generate(
    metadata: PageMetadata,
    mode: AuthorDisplayMode
  ): CitationResult {
    const authorStr = this.formatAuthors(metadata.authors, mode);
    const year = this.extractYear(metadata.datePublished);
    const dateStr = year ? `(${year})` : "(s.f.)";
    const title = metadata.title.trim();
    const siteName = metadata.siteName?.trim() || "";
    const url = metadata.url.trim();

    // ─── Reference list entry ───
    const refParts: string[] = [];

    if (authorStr) {
      refParts.push(`${authorStr}.`);
    }

    refParts.push(dateStr + ".");

    if (title) {
      refParts.push(`${title}.`);
    }

    if (siteName) {
      refParts.push(`${siteName}.`);
    }

    refParts.push(url);

    const referenceList = refParts.join(" ");

    // HTML version: title in italics
    const refPartsHtml: string[] = [];

    if (authorStr) {
      refPartsHtml.push(`${this.escapeHtml(authorStr)}.`);
    }

    refPartsHtml.push(this.escapeHtml(dateStr) + ".");

    if (title) {
      refPartsHtml.push(`<em>${this.escapeHtml(title)}</em>.`);
    }

    if (siteName) {
      refPartsHtml.push(`${this.escapeHtml(siteName)}.`);
    }

    refPartsHtml.push(
      `<a href="${this.escapeHtml(url)}" target="_blank" rel="noopener">${this.escapeHtml(url)}</a>`
    );

    const referenceListHtml = refPartsHtml.join(" ");

    // ─── Parenthetical citation ───
    const parentheticalAuthor = this.formatParentheticalAuthor(
      metadata.authors,
      mode,
      metadata.title
    );
    const parenthetical = `(${parentheticalAuthor}, ${year || "s.f."})`;

    return { referenceList, referenceListHtml, parenthetical };
  }

  /**
   * Format authors for the reference list entry.
   *
   * Person mode: "Apellido, I." or "Apellido, I., & Apellido, I."
   * Institutional mode: Full organization name.
   */
  private static formatAuthors(
    authors: PageMetadata["authors"],
    mode: AuthorDisplayMode
  ): string {
    if (authors.length === 0) return "";

    if (mode === "institutional") {
      // Use the first author's full name as the institutional author
      return authors[0].name.trim();
    }

    // Person mode
    const formatted = authors.map((a) => this.formatPersonName(a.name));

    if (formatted.length === 1) {
      return formatted[0];
    }

    if (formatted.length === 2) {
      return `${formatted[0]}, & ${formatted[1]}`;
    }

    // 3-20 authors: list all with & before last
    if (formatted.length <= 20) {
      const allButLast = formatted.slice(0, -1).join(", ");
      return `${allButLast}, & ${formatted[formatted.length - 1]}`;
    }

    // 21+ authors: first 19, ..., last
    const first19 = formatted.slice(0, 19).join(", ");
    return `${first19}, . . . ${formatted[formatted.length - 1]}`;
  }

  /**
   * Convert "Juan Carlos Pérez" to "Pérez, J. C."
   */
  private static formatPersonName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return fullName;
    if (parts.length === 1) return parts[0];

    const surname = parts[parts.length - 1];
    const initials = parts
      .slice(0, -1)
      .map((p) => `${p.charAt(0).toUpperCase()}.`)
      .join(" ");

    return `${surname}, ${initials}`;
  }

  /**
   * Format the author portion of the parenthetical citation.
   *
   * Person: first author's surname only; "et al." for 3+ authors.
   * Institutional: full name, shortened if possible.
   * Fallback: use title if no authors.
   */
  private static formatParentheticalAuthor(
    authors: PageMetadata["authors"],
    mode: AuthorDisplayMode,
    title: string
  ): string {
    if (authors.length === 0) {
      // APA 7: use title (shortened) when no author
      const shortened =
        title.length > 40 ? title.substring(0, 40).trim() + "…" : title;
      return `"${shortened}"`;
    }

    if (mode === "institutional") {
      return authors[0].name.trim();
    }

    // Person mode
    const surname = authors[0].name.trim().split(/\s+/).pop() || "";

    if (authors.length === 1) return surname;
    if (authors.length === 2) {
      const surname2 = authors[1].name.trim().split(/\s+/).pop() || "";
      return `${surname} & ${surname2}`;
    }
    // 3+ authors: first surname + et al.
    return `${surname} et al.`;
  }

  /**
   * Extract a 4-digit year from various date formats.
   */
  private static extractYear(dateStr: string | null): string | null {
    if (!dateStr) return null;
    const match = dateStr.match(/(\d{4})/);
    return match ? match[1] : null;
  }

  private static escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
