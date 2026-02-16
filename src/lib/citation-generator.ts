import type {
  PageMetadata,
  AuthorDisplayMode,
  CitationResult,
} from "./types";

/**
 * APA 7th Edition Citation Generator (Spanish Version).
 *
 * Produces:
 * - Reference list entry: Author. (Date). Title. Site Name. URL
 * - Parenthetical citation: (Author, Year)
 * - Narrative citation: Author (Year)
 */
export class CitationGenerator {
  /**
   * Generate both citation formats from extracted metadata.
   */
  static generate(
    metadata: PageMetadata,
    mode: AuthorDisplayMode
  ): CitationResult {
    // 1. Authors
    const authorStr = this.formatAuthors(metadata.authors, mode);

    // 2. Date
    // APA 7 Spanish: (Año, Día de Mes) or (Año) or (s.f.)
    const dateStr = this.formatDate(metadata.datePublished);
    const year = this.extractYear(metadata.datePublished);
    const yearStr = year || "s.f.";

    // 3. Title (Sentence case)
    const rawTitle = metadata.title.trim();
    const title = this.toSentenceCase(rawTitle);

    // 4. Site Name
    let siteName = metadata.siteName?.trim() || "";
    if (authorStr && siteName && this.areSimilar(authorStr, siteName)) {
      siteName = "";
    }

    const url = metadata.url.trim();
    const type = metadata.sourceType;

    // Logic for italics based on source type
    const isPeriodical = ["article", "news", "blog"].includes(type);

    // ─── Reference list entry construction ───
    let segment1 = ""; // Author or Title
    let segment2 = ""; // Date
    let segment3 = ""; // Title (if not used as author)
    let segment4 = ""; // Site
    let segment5 = ""; // URL

    // HTML versions
    let segment1H = "";
    let segment2H = "";
    let segment3H = "";
    let segment4H = "";
    let segment5H = "";

    // Logic handling "No Author" -> Title moves to front
    let titleAsAuthor = false;
    if (!authorStr && title) {
        titleAsAuthor = true;
    }

    const datePart = ` ${dateStr}.`; // leading space for join

    if (titleAsAuthor) {
       // Title in pos 1
       if (isPeriodical) {
          // Article title normal
          segment1 = `${title}.`;
          segment1H = `${this.escapeHtml(title)}.`;
       } else {
          // Webpage title italics
          segment1 = `${title}.`;
          segment1H = `<em>${this.escapeHtml(title)}</em>.`;
       }
       
       segment2 = datePart;
       segment2H = this.escapeHtml(datePart);
       
       // Segment 3 is empty
    } else {
       // Author in pos 1
       segment1 = `${authorStr}.`;
       segment1H = `${this.escapeHtml(authorStr)}.`;
       
       segment2 = datePart;
       segment2H = this.escapeHtml(datePart);
       
       // Title in pos 3
       if (isPeriodical) {
          segment3 = ` ${title}.`;
          segment3H = ` ${this.escapeHtml(title)}.`;
       } else {
          segment3 = ` ${title}.`;
          segment3H = ` <em>${this.escapeHtml(title)}</em>.`;
       }
    }

    // Site Name
    if (siteName) {
       if (isPeriodical) {
          // Magazine/News name italics
          segment4 = ` ${siteName}.`;
          segment4H = ` <em>${this.escapeHtml(siteName)}</em>.`;
       } else {
          // Webpage site name normal
          segment4 = ` ${siteName}.`;
          segment4H = ` ${this.escapeHtml(siteName)}.`;
       }
    }

    // URL - Render as text, not as a link
    segment5 = ` ${url}`;
    segment5H = ` ${this.escapeHtml(url)}`;

    const referenceList = (segment1 + segment2 + segment3 + segment4 + segment5).trim();
    const referenceListHtml = (segment1H + segment2H + segment3H + segment4H + segment5H).trim();

    // ─── In-text citations ───
    const parentheticalAuthor = this.formatParentheticalAuthor(
      metadata.authors,
      mode,
      metadata.title
    );
    
    const parenthetical = `(${parentheticalAuthor}, ${yearStr})`;
    const narrative = `${parentheticalAuthor} (${yearStr})`;

    return { referenceList, referenceListHtml, parenthetical, narrative };
  }

  // ─── Helpers ───

  /**
   * Format authors for reference list.
   */
  private static formatAuthors(
    authors: PageMetadata["authors"],
    mode: AuthorDisplayMode
  ): string {
    if (authors.length === 0) return "";

    if (mode === "institutional") {
      return authors[0].name.trim();
    }

    // Person mode
    const formatted = authors.map((a) => this.formatPersonName(a.name));

    if (formatted.length === 1) return formatted[0];

    if (formatted.length === 2) {
      return `${formatted[0]} y ${formatted[1]}`;
    }

    if (formatted.length <= 20) {
      const allButLast = formatted.slice(0, -1).join(", ");
      return `${allButLast} y ${formatted[formatted.length - 1]}`;
    }

    const first19 = formatted.slice(0, 19).join(", ");
    const last = formatted[formatted.length - 1];
    return `${first19}, ... ${last}`;
  }

  /**
   * "Juan Carlos Pérez" -> "Pérez, J. C."
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
   * Parenthetical author string: "Pérez", "Pérez y Gómez", "Pérez et al."
   */
  private static formatParentheticalAuthor(
    authors: PageMetadata["authors"],
    mode: AuthorDisplayMode,
    title: string
  ): string {
    if (authors.length === 0) {
      const shortTitle =
        title.length > 30 ? title.substring(0, 30).trim() + "..." : title;
      return `"${shortTitle}"`;
    }

    if (mode === "institutional") {
      return authors[0].name.trim();
    }

    const getSurname = (name: string) => {
        const parts = name.trim().split(/\s+/);
        return parts[parts.length - 1];
    };

    if (authors.length === 1) return getSurname(authors[0].name);
    
    if (authors.length === 2) {
      return `${getSurname(authors[0].name)} y ${getSurname(authors[1].name)}`;
    }

    return `${getSurname(authors[0].name)} et al.`;
  }

  /**
   * Format date: (2023, 15 de mayo) or (2023) or (s.f.)
   */
  private static formatDate(dateStr: string | null): string {
    if (!dateStr) return "(s.f.)";
    
    const normDate = dateStr.replace(/\//g, "-");
    const match = normDate.match(/^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?/);
    
    if (!match) {
        const yearMatch = dateStr.match(/(\d{4})/);
        return yearMatch ? `(${yearMatch[1]})` : "(s.f.)";
    }

    const year = match[1];
    const monthStr = match[2];
    const dayStr = match[3];

    if (!monthStr) {
        return `(${year})`;
    }

    const months = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio", 
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    
    const monthIndex = parseInt(monthStr, 10) - 1;
    if (monthIndex < 0 || monthIndex > 11) return `(${year})`;
    
    const monthName = months[monthIndex];

    if (dayStr) {
        const day = parseInt(dayStr, 10);
        return `(${year}, ${day} de ${monthName})`;
    }
    
    return `(${year}, ${monthName})`;
  }

  private static extractYear(dateStr: string | null): string | null {
    if (!dateStr) return null;
    const match = dateStr.match(/(\d{4})/);
    return match ? match[1] : null;
  }

  private static toSentenceCase(str: string): string {
    if (!str) return "";
    const parts = str.split(':');
    return parts.map((part, index) => {
        const trimmed = part.trim();
        if (!trimmed) return "";
        const lower = trimmed.toLowerCase();
        const sentence = lower.charAt(0).toUpperCase() + lower.slice(1);
        return index === 0 ? sentence : " " + sentence;
    }).join(':');
  }

  private static areSimilar(s1: string, s2: string): boolean {
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const n1 = clean(s1);
    const n2 = clean(s2);
    return n1.includes(n2) || n2.includes(n1);
  }

  private static escapeHtml(str: string): string {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
