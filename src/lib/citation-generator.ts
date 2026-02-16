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

    // 3. Title (Sentence case)
    // APA 7: Capitalize only first word of title and subtitle. Proper nouns capitalized.
    // We do a best-effort sentence case conversion.
    const rawTitle = metadata.title.trim();
    const title = this.toSentenceCase(rawTitle);

    // 4. Site Name
    // Omit if author is the same as site name to avoid repetition
    let siteName = metadata.siteName?.trim() || "";
    if (authorStr && siteName && this.areSimilar(authorStr, siteName)) {
      siteName = "";
    }

    const url = metadata.url.trim();
    const type = metadata.sourceType;

    // Logic for italics based on source type
    // - Article/News/Blog: Title normal, Site Name italics
    // - Webpage/Report/Other: Title italics, Site Name normal
    const isPeriodical = ["article", "news", "blog"].includes(type);

    // ─── Reference list entry construction ───
    
    // We build HTML and Plain text in parallel
    let htmlParts: string[] = [];
    let textParts: string[] = [];

    // Part 1: Author
    if (authorStr) {
      textParts.push(`${authorStr}.`);
      htmlParts.push(`${this.escapeHtml(authorStr)}.`);
    } else {
      // If no author, title moves to first position (APA rule), but for simplicity in this tool
      // we often keep the structure or use title as author.
      // However, usually we just skip author and start with title in APA if no author.
      // But let's stick to the requested structure: Author (or title if missing) -> Date -> ...
      // If author missing, we usually put title first.
      // For this implementation, if authorStr is empty, we proceed.
      // The user prompt said: "Si no hay autor: Usa el título o la organización corporativa."
      // If organization, it's covered in authors. If title, we should swap.
      // Let's implement the swap if author is empty.
    }

    // Logic handling "No Author" -> Title moves to front
    // If authorStr is empty, we use Title as author for the first part.
    let titleAsAuthor = false;
    if (!authorStr && title) {
        titleAsAuthor = true;
    }

    // Actually, constructing linearly is easier if we handle the swap.
    // Case A: Author present
    // Author. (Date). Title. Site. URL
    
    // Case B: No Author
    // Title. (Date). Site. URL
    
    // Let's build the segments
    const datePart = ` ${dateStr}.`; // leading space for join
    
    let segment1 = ""; // Author or Title
    let segment2 = ""; // Date
    let segment3 = ""; // Title (if not used as author) or nothing
    let segment4 = ""; // Site
    let segment5 = ""; // URL

    // HTML versions
    let segment1H = "";
    let segment2H = "";
    let segment3H = "";
    let segment4H = "";
    let segment5H = "";

    if (titleAsAuthor) {
       // Title in pos 1
       // Italics depend on type
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
       
       // Segment 3 is empty because title is used
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

    // URL
    segment5 = ` ${url}`;
    segment5H = ` <a href="${this.escapeHtml(url)}" target="_blank" rel="noopener">${this.escapeHtml(url)}</a>`;

    const referenceList = (segment1 + segment2 + segment3 + segment4 + segment5).trim();
    const referenceListHtml = (segment1H + segment2H + segment3H + segment4H + segment5H).trim();

    // ─── Parenthetical citation ───
    const parentheticalAuthor = this.formatParentheticalAuthor(
      metadata.authors,
      mode,
      metadata.title
    );
    // If no date, s.f.
    const yearStr = year || "s.f.";
    const parenthetical = `(${parentheticalAuthor}, ${yearStr})`;

    // ─── Narrative citation ───
    const narrative = `${parentheticalAuthor} (${yearStr})`;

    return { referenceList, referenceListHtml, parenthetical, narrative };
  }

  // ─── Helpers ───

  /**
   * Format authors for reference list.
   * - Uses "y" instead of "&".
   * - 21+ authors: first 19 ... last.
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

    // 3-20 authors: comma separated, 'y' before last
    if (formatted.length <= 20) {
      const allButLast = formatted.slice(0, -1).join(", ");
      return `${allButLast} y ${formatted[formatted.length - 1]}`;
    }

    // 21+ authors: first 19, ... last
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
   * Parenthetical: (Author, Year)
   * - 1 author: (Pérez)
   * - 2 authors: (Pérez y Gómez)
   * - 3+ authors: (Pérez et al.)
   * - No author: ("Title")
   */
  private static formatParentheticalAuthor(
    authors: PageMetadata["authors"],
    mode: AuthorDisplayMode,
    title: string
  ): string {
    if (authors.length === 0) {
      // Shorten title
      const shortTitle =
        title.length > 30 ? title.substring(0, 30).trim() + "..." : title;
      // Titles in parenthetical are usually in quotation marks for articles/chapters, 
      // or italics for books/reports. 
      // We'll use quotes as a safe default for now, or match reference type.
      // But simple double quotes is standard fallback.
      return `"${shortTitle}"`;
    }

    if (mode === "institutional") {
      return authors[0].name.trim();
    }

    // Person mode - extract surnames
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
   * Handles ISO strings like "2023-05-15" or just "2023".
   */
  private static formatDate(dateStr: string | null): string {
    if (!dateStr) return "(s.f.)";
    
    // Normalize separator
    const normDate = dateStr.replace(/\//g, "-");
    
    // Attempt to match YYYY-MM-DD or YYYY-MM or YYYY
    const match = normDate.match(/^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?/);
    
    if (!match) {
        // Fallback: try to just find a year
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

  /**
   * Convert to sentence case: "The Impact of AI" -> "The impact of AI"
   */
  private static toSentenceCase(str: string): string {
    if (!str) return "";
    
    // If string is already mixed case and looks fine, we might want to keep it?
    // But strict APA requires sentence case.
    
    // Split by colon for subtitles
    const parts = str.split(':');
    
    return parts.map((part, index) => {
        const trimmed = part.trim();
        if (!trimmed) return "";
        
        const lower = trimmed.toLowerCase();
        // Capitalize first letter
        const sentence = lower.charAt(0).toUpperCase() + lower.slice(1);
        
        // Add space after colon if it's a subtitle
        return index === 0 ? sentence : " " + sentence;
    }).join(':');
  }

  /**
   * Check if author name contains site name or vice versa to avoid duplication.
   * e.g. "BBC News" and "BBC News" -> true
   */
  private static areSimilar(s1: string, s2: string): boolean {
    // Remove punctuation and spaces, lowercase
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const n1 = clean(s1);
    const n2 = clean(s2);
    
    // Check for inclusion or equality
    // e.g. "The New York Times" contains "New York Times"
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
