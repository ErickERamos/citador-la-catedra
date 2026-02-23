import type { PageMetadata, AuthorDisplayMode, CitationResult } from "./types";

/**
 * Helper class for common formatting tasks
 */
class CitationHelpers {
  static escapeHtml(str: string): string {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  static toSentenceCase(str: string): string {
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

  static extractYear(dateStr: string | null): string | null {
    if (!dateStr) return null;
    const match = dateStr.match(/(\d{4})/);
    return match ? match[1] : null;
  }

  static formatDate(dateStr: string | null, format: "full" | "year" | "accessed" = "full"): string {
    if (!dateStr) return format === "accessed" ? `[Consulta: ${new Date().toLocaleDateString("es-ES")}]` : "(s.f.)";
    
    const normDate = dateStr.replace(/\//g, "-");
    const match = normDate.match(/^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?/);
    
    if (!match) {
        const yearMatch = dateStr.match(/(\d{4})/);
        return yearMatch ? yearMatch[1] : "(s.f.)";
    }

    const year = match[1];
    const monthStr = match[2];
    const dayStr = match[3];

    if (format === "year") return year;

    if (!monthStr) return year;

    const months = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio", 
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    
    const monthIndex = parseInt(monthStr, 10) - 1;
    if (monthIndex < 0 || monthIndex > 11) return year;
    
    const monthName = months[monthIndex];

    if (dayStr) {
        const day = parseInt(dayStr, 10);
        return `${day} de ${monthName} de ${year}`;
    }
    
    return `${monthName} de ${year}`;
  }

  static formatAuthors(
    authors: PageMetadata["authors"],
    mode: AuthorDisplayMode,
    style: "apa" | "mla" | "chicago" | "harvard" | "iso" | "vancouver" | "ieee"
  ): string {
    if (authors.length === 0) return "";

    if (mode === "institutional") {
      return authors[0].name.trim();
    }

    const personNames = authors.map(a => a.name);

    if (style === "apa") {
      const formatted = personNames.map(name => this.formatPersonName(name, "initials"));
      if (formatted.length === 1) return formatted[0];
      if (formatted.length === 2) return `${formatted[0]} y ${formatted[1]}`;
      if (formatted.length <= 20) {
        const allButLast = formatted.slice(0, -1).join(", ");
        return `${allButLast} y ${formatted[formatted.length - 1]}`;
      }
      return `${formatted.slice(0, 19).join(", ")}, ... ${formatted[formatted.length - 1]}`;
    }

    if (style === "mla" || style === "chicago") {
      const formatted = personNames.map(name => this.formatPersonName(name, "full"));
      if (formatted.length === 1) return formatted[0];
      if (formatted.length === 2) return `${formatted[0]} y ${formatted[1]}`;
      if (formatted.length === 3) return `${formatted[0]}, ${formatted[1]} y ${formatted[2]}`;
      return `${formatted[0]} et al.`;
    }

    if (style === "harvard" || style === "iso") {
       const formatted = personNames.map(name => this.formatPersonName(name, "initials").toUpperCase());
       if (formatted.length === 1) return formatted[0];
       if (formatted.length === 2) return `${formatted[0]} y ${formatted[1]}`;
       if (formatted.length === 3) return `${formatted[0]}, ${formatted[1]} y ${formatted[2]}`;
       return `${formatted[0]} et al.`;
    }
    
    if (style === "vancouver") {
        const formatted = personNames.map(name => this.formatPersonName(name, "no-dots"));
        if (formatted.length <= 6) return formatted.join(", ");
        return `${formatted.slice(0, 6).join(", ")} et al.`;
    }

    if (style === "ieee") {
        // IEEE uses "J. K. Author"
        const formatted = personNames.map(name => {
            const parts = name.trim().split(/\s+/);
            if (parts.length === 1) return parts[0];
            const surname = parts[parts.length - 1];
            const initials = parts.slice(0, -1).map(p => `${p.charAt(0).toUpperCase()}.`).join(" ");
            return `${initials} ${surname}`;
        });
        if (formatted.length === 1) return formatted[0];
        if (formatted.length === 2) return `${formatted[0]} y ${formatted[1]}`;
        return `${formatted[0]} et al.`;
    }

    return personNames.join(", ");
  }

  static formatPersonName(fullName: string, style: "initials" | "full" | "no-dots"): string {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return fullName;
    if (parts.length === 1) return parts[0];

    const surname = parts[parts.length - 1];
    const otherNames = parts.slice(0, -1);

    if (style === "full") {
        return `${surname}, ${otherNames.join(" ")}`;
    }

    if (style === "initials") {
        const initials = otherNames.map(p => `${p.charAt(0).toUpperCase()}.`).join(" ");
        return `${surname}, ${initials}`;
    }

    if (style === "no-dots") {
        const initials = otherNames.map(p => p.charAt(0).toUpperCase()).join("");
        return `${surname} ${initials}`;
    }

    return fullName;
  }
}

/**
 * Strategy interface for citation generation
 */
interface CitationStrategy {
  generate(metadata: PageMetadata, mode: AuthorDisplayMode): CitationResult;
}

// 1. APA 7 Strategy
export class Apa7Strategy implements CitationStrategy {
  generate(metadata: PageMetadata, mode: AuthorDisplayMode): CitationResult {
    const authors = CitationHelpers.formatAuthors(metadata.authors, mode, "apa");
    const dateStr = this.formatDate(metadata.datePublished);
    const year = CitationHelpers.extractYear(metadata.datePublished) || "s.f.";
    const title = CitationHelpers.toSentenceCase(metadata.title);
    const siteName = metadata.siteName || "";
    const url = metadata.url;
    const isPeriodical = ["article", "news", "blog"].includes(metadata.sourceType);

    // Logic similar to original implementation
    let ref = "";
    let refHtml = "";

    const authorPart = authors ? (authors.endsWith(".") ? authors : `${authors}.`) : `${title}.`;
    const authorPartHtml = authors ? (authors.endsWith(".") ? CitationHelpers.escapeHtml(authors) : `${CitationHelpers.escapeHtml(authors)}.`) : (isPeriodical ? `${CitationHelpers.escapeHtml(title)}.` : `<em>${CitationHelpers.escapeHtml(title)}</em>.`);
    
    const datePart = ` (${dateStr}).`;
    
    let titlePart = "";
    let titlePartHtml = "";
    
    if (authors) {
        titlePart = ` ${title}.`;
        titlePartHtml = isPeriodical ? ` ${CitationHelpers.escapeHtml(title)}.` : ` <em>${CitationHelpers.escapeHtml(title)}</em>.`;
    }

    let sitePart = "";
    let sitePartHtml = "";
    if (siteName && (!authors || !siteName.includes(authors.split(',')[0]))) {
        sitePart = ` ${siteName}.`;
        sitePartHtml = isPeriodical ? ` <em>${CitationHelpers.escapeHtml(siteName)}</em>.` : ` ${CitationHelpers.escapeHtml(siteName)}.`;
    }

    ref = `${authorPart}${datePart}${titlePart}${sitePart} ${url}`;
    refHtml = `${authorPartHtml}${CitationHelpers.escapeHtml(datePart)}${titlePartHtml}${sitePartHtml} ${CitationHelpers.escapeHtml(url)}`;

    // In-text
    const surname = authors ? authors.split(',')[0] : (title.length > 20 ? `"${title.substring(0, 20)}..."` : `"${title}"`);
    const parenthetical = `(${surname}, ${year})`;
    const narrative = `${surname} (${year})`;

    return { referenceList: ref.trim(), referenceListHtml: refHtml.trim(), parenthetical, narrative };
  }

  private formatDate(dateStr: string | null): string {
    if (!dateStr) return "s.f.";
    const full = CitationHelpers.formatDate(dateStr, "full");
    // APA wants (Year, Day Month) or (Year)
    const match = full.match(/(\d{4})/);
    if (full.includes(" de ")) {
        // "15 de mayo de 2023" -> "2023, 15 de mayo"
        const parts = full.split(" de ");
        if (parts.length === 3) return `${parts[2]}, ${parts[0]} de ${parts[1]}`;
        if (parts.length === 2) return `${parts[1]}, ${parts[0]}`; // Month Year
    }
    return match ? match[1] : "s.f.";
  }
}

// 2. MLA Strategy
export class MlaStrategy implements CitationStrategy {
  generate(metadata: PageMetadata, mode: AuthorDisplayMode): CitationResult {
    const authors = CitationHelpers.formatAuthors(metadata.authors, mode, "mla");
    const title = metadata.title; // MLA uses Title Case usually, but we'll stick to input for now
    const siteName = metadata.siteName || "";
    const dateStr = CitationHelpers.formatDate(metadata.datePublished, "full"); // Day Month Year
    const url = metadata.url;

    let ref = "";
    let refHtml = "";

    if (authors) {
        ref += `${authors}. `;
        refHtml += `${CitationHelpers.escapeHtml(authors)}. `;
    }

    ref += `"${title}." `;
    refHtml += `"${CitationHelpers.escapeHtml(title)}." `;

    if (siteName) {
        ref += `${siteName}, `;
        refHtml += `<em>${CitationHelpers.escapeHtml(siteName)}</em>, `;
    }

    if (dateStr !== "(s.f.)") {
        ref += `${dateStr}, `;
        refHtml += `${CitationHelpers.escapeHtml(dateStr)}, `;
    }

    ref += url.replace(/^https?:\/\//, "") + ".";
    refHtml += CitationHelpers.escapeHtml(url.replace(/^https?:\/\//, "")) + ".";

    const surname = authors ? authors.split(',')[0] : `"${title.substring(0, 20)}..."`;
    const parenthetical = `(${surname})`;
    const narrative = `${surname}`;

    return { referenceList: ref.trim(), referenceListHtml: refHtml.trim(), parenthetical, narrative };
  }
}

// 3. Chicago Strategy (Author-Date)
export class ChicagoStrategy implements CitationStrategy {
  generate(metadata: PageMetadata, mode: AuthorDisplayMode): CitationResult {
    const authors = CitationHelpers.formatAuthors(metadata.authors, mode, "chicago");
    const year = CitationHelpers.extractYear(metadata.datePublished) || "s.f.";
    const title = metadata.title;
    const siteName = metadata.siteName || "";
    const url = metadata.url;
    const accessed = `Consultado el ${new Date().toLocaleDateString("es-ES")}`;

    let ref = "";
    let refHtml = "";

    if (authors) {
        ref += `${authors}. ${year}. `;
        refHtml += `${CitationHelpers.escapeHtml(authors)}. ${year}. `;
    } else {
        ref += `${title}. ${year}. `;
        refHtml += `${CitationHelpers.escapeHtml(title)}. ${year}. `;
    }

    if (authors) {
        ref += `"${title}". `;
        refHtml += `"${CitationHelpers.escapeHtml(title)}". `;
    }

    if (siteName) {
        ref += `${siteName}. `;
        refHtml += `<em>${CitationHelpers.escapeHtml(siteName)}</em>. `;
    }

    ref += `${accessed}. ${url}.`;
    refHtml += `${accessed}. ${CitationHelpers.escapeHtml(url)}.`;

    const surname = authors ? authors.split(',')[0] : `"${title.substring(0, 20)}..."`;
    const parenthetical = `(${surname} ${year})`;
    const narrative = `${surname} (${year})`;

    return { referenceList: ref.trim(), referenceListHtml: refHtml.trim(), parenthetical, narrative };
  }
}

// 4. Harvard Strategy
export class HarvardStrategy implements CitationStrategy {
  generate(metadata: PageMetadata, mode: AuthorDisplayMode): CitationResult {
    const authors = CitationHelpers.formatAuthors(metadata.authors, mode, "harvard");
    const year = CitationHelpers.extractYear(metadata.datePublished) || "s.f.";
    const title = metadata.title;
    const siteName = metadata.siteName || "";
    const url = metadata.url;
    const accessed = `[Consultado: ${new Date().toLocaleDateString("es-ES")}]`;

    let ref = "";
    let refHtml = "";

    if (authors) {
        ref += `${authors} (${year}) `;
        refHtml += `${CitationHelpers.escapeHtml(authors)} (${year}) `;
    } else {
        ref += `${siteName || "Anónimo"} (${year}) `;
        refHtml += `${CitationHelpers.escapeHtml(siteName || "Anónimo")} (${year}) `;
    }

    ref += `'${title}'. `;
    refHtml += `<em>${CitationHelpers.escapeHtml(title)}</em>. `;

    if (siteName && authors) {
        ref += `Disponible en: ${siteName}. `;
        refHtml += `Disponible en: ${CitationHelpers.escapeHtml(siteName)}. `;
    }

    ref += `Disponible en: ${url} ${accessed}.`;
    refHtml += `Disponible en: ${CitationHelpers.escapeHtml(url)} ${accessed}.`;

    const surname = authors ? authors.split(',')[0] : (siteName || "Anónimo");
    const parenthetical = `(${surname}, ${year})`;
    const narrative = `${surname} (${year})`;

    return { referenceList: ref.trim(), referenceListHtml: refHtml.trim(), parenthetical, narrative };
  }
}

// 5. UNE-ISO 690 Strategy
export class UneIso690Strategy implements CitationStrategy {
  generate(metadata: PageMetadata, mode: AuthorDisplayMode): CitationResult {
    const authors = CitationHelpers.formatAuthors(metadata.authors, mode, "iso");
    const title = metadata.title;
    const year = CitationHelpers.extractYear(metadata.datePublished) || "[s.f.]";
    const siteName = metadata.siteName || "";
    const url = metadata.url;
    const accessed = `[Consulta: ${new Date().toLocaleDateString("es-ES")}]`;

    let ref = "";
    let refHtml = "";

    if (authors) {
        const authPart = authors.endsWith(".") ? authors : `${authors}.`;
        ref += `${authPart} `;
        refHtml += `<span style="font-variant:small-caps">${CitationHelpers.escapeHtml(authPart)}</span> `;
    }

    ref += `${title} [en línea]. `;
    refHtml += `<em>${CitationHelpers.escapeHtml(title)}</em> [en línea]. `;

    if (siteName) {
        ref += `${siteName}, `;
        refHtml += `${CitationHelpers.escapeHtml(siteName)}, `;
    }

    ref += `${year}. `;
    refHtml += `${year}. `;

    ref += `Disponible en: ${url} ${accessed}.`;
    refHtml += `Disponible en: ${CitationHelpers.escapeHtml(url)} ${accessed}.`;

    const surname = authors ? authors.split(',')[0] : "Anónimo";
    const parenthetical = `(${surname}, ${year})`;
    const narrative = `${surname} (${year})`;

    return { referenceList: ref.trim(), referenceListHtml: refHtml.trim(), parenthetical, narrative };
  }
}

// 6. IEEE Strategy
export class IeeeStrategy implements CitationStrategy {
  generate(metadata: PageMetadata, mode: AuthorDisplayMode): CitationResult {
    const authors = CitationHelpers.formatAuthors(metadata.authors, mode, "ieee");
    const title = metadata.title;
    const siteName = metadata.siteName || "";
    const year = CitationHelpers.extractYear(metadata.datePublished) || "s.f.";
    const url = metadata.url;

    let ref = `[1] ${authors ? authors + ", " : ""}`;
    let refHtml = `[1] ${authors ? CitationHelpers.escapeHtml(authors) + ", " : ""}`;

    ref += `"${title}," `;
    refHtml += `"${CitationHelpers.escapeHtml(title)}," `;

    if (siteName) {
        ref += `${siteName}, `;
        refHtml += `<em>${CitationHelpers.escapeHtml(siteName)}</em>, `;
    }

    ref += `${year}. [En línea]. Disponible: ${url}.`;
    refHtml += `${year}. [En línea]. Disponible: ${CitationHelpers.escapeHtml(url)}.`;

    return { 
        referenceList: ref.trim(), 
        referenceListHtml: refHtml.trim(), 
        parenthetical: "[1]", 
        narrative: "Ref. [1]" 
    };
  }
}

// 7. Vancouver Strategy
export class VancouverStrategy implements CitationStrategy {
  generate(metadata: PageMetadata, mode: AuthorDisplayMode): CitationResult {
    const authors = CitationHelpers.formatAuthors(metadata.authors, mode, "vancouver");
    const title = metadata.title;
    const siteName = metadata.siteName || "";
    const url = metadata.url;
    const accessed = new Date().toLocaleDateString("es-ES");

    let ref = "";
    let refHtml = "";

    if (authors) {
        ref += `${authors}. `;
        refHtml += `${CitationHelpers.escapeHtml(authors)}. `;
    }

    ref += `${title} [Internet]. `;
    refHtml += `${CitationHelpers.escapeHtml(title)} [Internet]. `;

    if (siteName) {
        ref += `${siteName}; `;
        refHtml += `${CitationHelpers.escapeHtml(siteName)}; `;
    }

    const year = CitationHelpers.extractYear(metadata.datePublished) || "s.f.";
    ref += `${year} [citado ${accessed}]. Disponible en: ${url}`;
    refHtml += `${year} [citado ${accessed}]. Disponible en: ${CitationHelpers.escapeHtml(url)}`;

    const citationNum = "(1)";

    return { 
        referenceList: ref.trim(), 
        referenceListHtml: refHtml.trim(), 
        parenthetical: citationNum, 
        narrative: citationNum 
    };
  }
}

// 8. ISO 690 (Generic) Strategy
export class Iso690Strategy implements CitationStrategy {
  generate(metadata: PageMetadata, mode: AuthorDisplayMode): CitationResult {
    // Very similar to UNE-ISO but without specific Spanish mandates like [en línea] strict placement
    const authors = CitationHelpers.formatAuthors(metadata.authors, mode, "iso");
    const title = metadata.title;
    const year = CitationHelpers.extractYear(metadata.datePublished) || "s.f.";
    const siteName = metadata.siteName || "";
    const url = metadata.url;
    const accessed = `[consulta: ${new Date().toLocaleDateString("es-ES")}]`;

    let ref = "";
    let refHtml = "";

    if (authors) {
        const authPart = authors.endsWith(".") ? authors : `${authors}.`;
        ref += `${authPart} `;
        refHtml += `<span style="font-variant:small-caps">${CitationHelpers.escapeHtml(authPart)}</span> `;
    }

    ref += `${title}. `;
    refHtml += `<em>${CitationHelpers.escapeHtml(title)}</em>. `;

    if (siteName) {
        ref += `${siteName}, `;
        refHtml += `${CitationHelpers.escapeHtml(siteName)}, `;
    }

    ref += `${year}. `;
    refHtml += `${year}. `;

    ref += `Disponible en: ${url}. ${accessed}.`;
    refHtml += `Disponible en: ${CitationHelpers.escapeHtml(url)}. ${accessed}.`;

    const surname = authors ? authors.split(',')[0] : "Anónimo";
    const parenthetical = `(${surname}, ${year})`;
    const narrative = `${surname} (${year})`;

    return { referenceList: ref.trim(), referenceListHtml: refHtml.trim(), parenthetical, narrative };
  }
}

// 9. Sistema Latino Strategy
export class LatinoStrategy implements CitationStrategy {
  generate(metadata: PageMetadata, mode: AuthorDisplayMode): CitationResult {
    const authors = CitationHelpers.formatAuthors(metadata.authors, mode, "mla"); // Full names
    const title = metadata.title;
    const siteName = metadata.siteName || "";
    const year = CitationHelpers.extractYear(metadata.datePublished) || "s.f.";
    const url = metadata.url;

    let ref = "";
    let refHtml = "";

    if (authors) {
        ref += `${authors}, `;
        refHtml += `<span style="font-variant:small-caps">${CitationHelpers.escapeHtml(authors)}</span>, `;
    }

    ref += `"${title}", `;
    refHtml += `"${CitationHelpers.escapeHtml(title)}", `;

    if (siteName) {
        ref += `en ${siteName}, `;
        refHtml += `en <em>${CitationHelpers.escapeHtml(siteName)}</em>, `;
    }

    ref += `${year}. Disponible en: ${url}`;
    refHtml += `${year}. Disponible en: ${CitationHelpers.escapeHtml(url)}`;

    const citationNum = "¹";

    return { 
        referenceList: ref.trim(), 
        referenceListHtml: refHtml.trim(), 
        parenthetical: citationNum, 
        narrative: citationNum 
    };
  }
}
