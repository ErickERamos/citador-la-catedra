/**
 * Content script: Hierarchical metadata extractor.
 * Injected on-demand via chrome.scripting.executeScript.
 * Returns a PageMetadata object to the caller.
 *
 * Priority: JSON-LD > Open Graph > Meta Tags > Microdata > CMS Patterns > Fallback
 */

interface AuthorInfo {
  name: string;
  type: "person" | "organization";
}

type SourceType = "webpage" | "article" | "news" | "blog" | "unknown";

interface PageMetadata {
  title: string;
  authors: AuthorInfo[];
  datePublished: string | null;
  siteName: string | null;
  url: string;
  sourceType: SourceType;
}

(function extractMetadata(): void {
  const metadata: PageMetadata = {
    title: "",
    authors: [],
    datePublished: null,
    siteName: null,
    url: window.location.href,
    sourceType: "unknown",
  };

  // ─── Helper: Clean title string ───
  function cleanTitle(title: string): string {
    if (!title) return "";
    let cleaned = title.trim();

    // 1. Remove common file type prefixes/suffixes
    // Matches: [PDF], (PDF), [DOC], (DOC), etc. at start
    cleaned = cleaned.replace(/^\[(PDF|DOC|DOCX|XLS|XLSX|PPT|PPTX)\]\s*/i, "");
    cleaned = cleaned.replace(/^\((PDF|DOC|DOCX|XLS|XLSX|PPT|PPTX)\)\s*/i, "");

    // 2. Remove site name suffixes
    // Matches: " - SiteName", " | SiteName", " : SiteName" at end
    // We look for a separator followed by text at the end of the string
    // Be careful not to cut off valid parts of titles that use these separators
    const separators = [" | ", " - ", " : ", " — ", " » "];
    for (const sep of separators) {
      if (cleaned.includes(sep)) {
        const parts = cleaned.split(sep);
        // If we have multiple parts, the last one is likely the site name
        // Heuristic: If the last part is short (< 30 chars) or matches known site name patterns, drop it
        if (parts.length > 1) {
          const lastPart = parts[parts.length - 1];
          // Simple heuristic: if the last part is significantly shorter than the rest, it's likely a suffix
          // Or if it matches the domain name
          if (lastPart.length < 40) {
             cleaned = parts.slice(0, -1).join(sep);
          }
        }
      }
    }

    return cleaned.trim();
  }

  // ─── Helper: only set if field is still empty ───
  function setIfEmpty<K extends keyof PageMetadata>(
    key: K,
    value: PageMetadata[K]
  ) {
    if (key === "authors") {
      if ((metadata.authors as AuthorInfo[]).length === 0 && Array.isArray(value) && (value as AuthorInfo[]).length > 0) {
        metadata.authors = value as AuthorInfo[];
      }
    } else if (key === "sourceType") {
      if (metadata.sourceType === "unknown" && value !== "unknown") {
        metadata.sourceType = value as SourceType;
      }
    } else if (key === "title") {
       // Apply cleaning to title before setting
       const cleanedValue = typeof value === "string" ? cleanTitle(value) : value;
       if (!metadata.title && cleanedValue) {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         (metadata as any)[key] = cleanedValue;
       }
    } else {
      if (!metadata[key] && value) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metadata as any)[key] = value;
      }
    }
  }

  // ─── Helper: guess if a name is a person or org ───
  function guessAuthorType(name: string): "person" | "organization" {
    const trimmed = name.trim();
    const words = trimmed.split(/\s+/);
    // Orgs tend to have 3+ words, or contain keywords
    const orgKeywords =
      /\b(inc|corp|llc|ltd|foundation|university|institute|association|organization|council|committee|department|ministry|gobierno|ministerio|universidad|fundaci[oó]n|asociaci[oó]n|oficina|consejo)\b/i;
    if (orgKeywords.test(trimmed)) return "organization";
    if (words.length <= 3 && words.every((w) => /^[A-ZÀ-ÖØ-Ý]/.test(w)))
      return "person";
    if (words.length > 4) return "organization";
    return "person";
  }

  // ─── Helper: map @type or og:type to SourceType ───
  function mapSourceType(rawType: string): SourceType {
    const t = rawType.toLowerCase();
    if (t.includes("article") || t === "article") return "article";
    if (t.includes("news")) return "news";
    if (t.includes("blog")) return "blog";
    if (t.includes("webpage") || t.includes("website")) return "webpage";
    return "unknown";
  }

  // ─── Date Extraction Helpers ───

  const DATE_PATTERNS = {
    // YYYY-MM-DD or YYYY/MM/DD
    ISO: /\b(20\d{2})[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/,
    // Spanish: dd de month de yyyy
    SPANISH: /\b(0?[1-9]|[12]\d|3[01])\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(20\d{2})\b/i,
    // English: Month dd, yyyy
    ENGLISH: /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(0?[1-9]|[12]\d|3[01]),?\s+(20\d{2})\b/i,
    // URL pattern: /2023/12/01/ or /2023/12/
    URL: /\/(20\d{2})\/(0[1-9]|1[0-2])\/(?:(0[1-9]|[12]\d|3[01])\/)?/,
  };

  const TRIGGER_PHRASES = [
    "Published:",
    "Posted:",
    "Updated:",
    "Publicado:",
    "Actualizado:",
    "Fecha:",
    "Date:",
    "Creado:",
    "Created:",
  ];

  function extractDateFromUrl(url: string): string | null {
    const match = url.match(DATE_PATTERNS.URL);
    if (match) {
      const year = match[1];
      const month = match[2];
      const day = match[3];
      if (day) return `${year}-${month}-${day}`;
      return `${year}-${month}`;
    }
    return null;
  }

  function extractDateFromMicrodata(): string | null {
    // Look for elements with itemprop="datePublished", "dateModified", etc.
    const itempropCandidates = [
      "datePublished",
      "dateModified",
      "dateCreated",
      "uploadDate",
    ];

    for (const prop of itempropCandidates) {
      const el = document.querySelector(`[itemprop="${prop}"]`);
      if (el) {
        const content = el.getAttribute("content") || el.getAttribute("datetime") || el.textContent;
        if (content) {
          const trimmed = content.trim();
          if (DATE_PATTERNS.ISO.test(trimmed)) return trimmed;
          // Try other patterns if ISO fails
          if (DATE_PATTERNS.SPANISH.test(trimmed)) return trimmed;
          if (DATE_PATTERNS.ENGLISH.test(trimmed)) return trimmed;
        }
      }
    }
    return null;
  }

  function extractDateFromClasses(): string | null {
    // Common CMS class names
    const classCandidates = [
      ".entry-date",
      ".published",
      ".updated",
      ".post-date",
      ".date-display-single", // Drupal
      ".field-name-post-date",
      "time.entry-date",
      ".article-date",
      ".meta-date",
    ];

    for (const selector of classCandidates) {
      const el = document.querySelector(selector);
      if (el) {
        const content = el.getAttribute("datetime") || el.textContent;
        if (content) {
          const trimmed = content.trim();
          if (DATE_PATTERNS.ISO.test(trimmed)) return trimmed;
          if (DATE_PATTERNS.SPANISH.test(trimmed)) return trimmed;
          if (DATE_PATTERNS.ENGLISH.test(trimmed)) return trimmed;
        }
      }
    }
    return null;
  }

  function extractDateFromDom(): string | null {
    // 1. Look for <time> elements
    const timeElements = document.querySelectorAll("time");
    for (const time of timeElements) {
      const datetime = time.getAttribute("datetime");
      if (datetime) return datetime;
      if (time.textContent && DATE_PATTERNS.ISO.test(time.textContent)) {
        return time.textContent.trim();
      }
    }

    // 2. Look for elements with class/id containing "date", "publish", "time"
    // (This is a broader fallback than extractDateFromClasses)
    const candidates = document.querySelectorAll(
      '[class*="date"], [class*="publish"], [class*="time"], [id*="date"], [id*="publish"]'
    );
    
    for (const el of candidates) {
      const text = el.textContent?.trim() || "";
      // Check for ISO
      let match = text.match(DATE_PATTERNS.ISO);
      if (match) return match[0];

      // Check for Spanish
      match = text.match(DATE_PATTERNS.SPANISH);
      if (match) return match[0]; // "15 de mayo de 2023"

      // Check for English
      match = text.match(DATE_PATTERNS.ENGLISH);
      if (match) return match[0];
    }

    return null;
  }

  function extractDateFromText(): string | null {
    // Scan the first 2000 characters of visible text
    const bodyText = document.body.innerText.substring(0, 2000);
    
    // 1. Check for Trigger Phrases first (more accurate)
    for (const phrase of TRIGGER_PHRASES) {
      const regex = new RegExp(`${phrase}\\s*([\\s\\S]{0,50})`, "i");
      const match = bodyText.match(regex);
      if (match && match[1]) {
        const potentialDate = match[1];
        if (DATE_PATTERNS.ISO.test(potentialDate)) return potentialDate.match(DATE_PATTERNS.ISO)![0];
        if (DATE_PATTERNS.SPANISH.test(potentialDate)) return potentialDate.match(DATE_PATTERNS.SPANISH)![0];
        if (DATE_PATTERNS.ENGLISH.test(potentialDate)) return potentialDate.match(DATE_PATTERNS.ENGLISH)![0];
      }
    }

    // 2. Fallback to raw pattern matching
    // ISO
    let match = bodyText.match(DATE_PATTERNS.ISO);
    if (match) return match[0];

    // Spanish
    match = bodyText.match(DATE_PATTERNS.SPANISH);
    if (match) return match[0];

    // English
    match = bodyText.match(DATE_PATTERNS.ENGLISH);
    if (match) return match[0];

    return null;
  }

  // ═══════════════════════════════════════════════════
  // LEVEL 1: JSON-LD
  // ═══════════════════════════════════════════════════
  try {
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent || "");
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
          // Handle @graph arrays
          const nodes = item["@graph"]
            ? [...item["@graph"], item]
            : [item];

          for (const node of nodes) {
            // Title
            if (node.headline) setIfEmpty("title", node.headline);
            if (node.name && !node.headline)
              setIfEmpty("title", node.name);

            // Date
            if (node.datePublished)
              setIfEmpty("datePublished", node.datePublished);
            if (node.dateModified && !metadata.datePublished)
              setIfEmpty("datePublished", node.dateModified);

            // Site name
            if (node.publisher?.name)
              setIfEmpty("siteName", node.publisher.name);

            // Source type
            if (node["@type"]) {
              const typeStr = Array.isArray(node["@type"])
                ? node["@type"][0]
                : node["@type"];
              setIfEmpty("sourceType", mapSourceType(typeStr));
            }

            // Authors
            if (node.author && metadata.authors.length === 0) {
              const rawAuthors = Array.isArray(node.author)
                ? node.author
                : [node.author];
              const parsed: AuthorInfo[] = [];
              for (const a of rawAuthors) {
                if (typeof a === "string") {
                  parsed.push({
                    name: a,
                    type: guessAuthorType(a),
                  });
                } else if (a.name) {
                  const aType =
                    a["@type"] === "Organization"
                      ? "organization"
                      : a["@type"] === "Person"
                        ? "person"
                        : guessAuthorType(a.name);
                  parsed.push({
                    name: a.name,
                    type: aType as "person" | "organization",
                  });
                }
              }
              setIfEmpty("authors", parsed);
            }
          }
        }
      } catch {
        // Skip malformed JSON-LD blocks
      }
    }
  } catch {
    // JSON-LD extraction failed entirely
  }

  // ═══════════════════════════════════════════════════
  // LEVEL 2: Open Graph / Article meta tags
  // ═══════════════════════════════════════════════════
  function getMetaContent(
    attr: string,
    value: string
  ): string | null {
    const el = document.querySelector(
      `meta[${attr}="${value}"]`
    ) as HTMLMetaElement | null;
    return el?.content?.trim() || null;
  }

  setIfEmpty("title", getMetaContent("property", "og:title") as string);
  setIfEmpty(
    "siteName",
    getMetaContent("property", "og:site_name") as string
  );
  setIfEmpty(
    "datePublished",
    getMetaContent("property", "article:published_time") as string
  );
  if (!metadata.datePublished) {
     setIfEmpty(
      "datePublished",
      getMetaContent("property", "og:published_time") as string
    );
  }
  if (!metadata.datePublished) {
    setIfEmpty(
      "datePublished",
      getMetaContent("property", "article:modified_time") as string
    );
  }


  const ogType = getMetaContent("property", "og:type");
  if (ogType) setIfEmpty("sourceType", mapSourceType(ogType));

  // article:author (can be name or URL)
  if (metadata.authors.length === 0) {
    const articleAuthor = getMetaContent("property", "article:author");
    if (articleAuthor && !articleAuthor.startsWith("http")) {
      setIfEmpty("authors", [
        { name: articleAuthor, type: guessAuthorType(articleAuthor) },
      ]);
    }
  }

  // ═══════════════════════════════════════════════════
  // LEVEL 3: Standard meta tags
  // ═══════════════════════════════════════════════════
  const metaNameCandidates = [
    { name: "author", field: "authors" as const },
    { name: "DC.creator", field: "authors" as const },
    { name: "citation_author", field: "authors" as const },
  ];
  for (const candidate of metaNameCandidates) {
    if (metadata.authors.length === 0) {
      const val = getMetaContent("name", candidate.name);
      if (val) {
        // Some pages list multiple authors comma-separated
        const names = val.includes(";")
          ? val.split(";")
          : val.includes(",") && val.split(",").length <= 4
            ? val.split(",")
            : [val];
        setIfEmpty(
          "authors",
          names.map((n) => ({
            name: n.trim(),
            type: guessAuthorType(n.trim()),
          }))
        );
      }
    }
  }

  const dateCandidates = [
    "publication_date",
    "citation_date",
    "date",
    "DC.date",
    "DC.date.issued",
    "parsely-pub-date",
    "sailthru.date",
    "pubdate",
    "last-modified",
    "original-publication-date",
    "citation_publication_date",
  ];
  for (const dc of dateCandidates) {
    const val = getMetaContent("name", dc);
    if (val) {
      setIfEmpty("datePublished", val);
      break;
    }
  }

  // Site name from application-name
  setIfEmpty(
    "siteName",
    getMetaContent("name", "application-name") as string
  );

  // ═══════════════════════════════════════════════════
  // LEVEL 4: Fallback (Microdata, Classes, URL, DOM, Text)
  // ═══════════════════════════════════════════════════
  
  // 4.1 Microdata (itemprop)
  if (!metadata.datePublished) {
    const microdataDate = extractDateFromMicrodata();
    if (microdataDate) setIfEmpty("datePublished", microdataDate);
  }

  // 4.2 CMS Classes
  if (!metadata.datePublished) {
    const classDate = extractDateFromClasses();
    if (classDate) setIfEmpty("datePublished", classDate);
  }

  // 4.3 URL Analysis
  if (!metadata.datePublished) {
    const urlDate = extractDateFromUrl(window.location.href);
    if (urlDate) setIfEmpty("datePublished", urlDate);
  }

  // 4.4 Semantic DOM Elements (General fallback)
  if (!metadata.datePublished) {
    const domDate = extractDateFromDom();
    if (domDate) setIfEmpty("datePublished", domDate);
  }

  // 4.5 Text Content Regex
  if (!metadata.datePublished) {
    const textDate = extractDateFromText();
    if (textDate) setIfEmpty("datePublished", textDate);
  }

  // ═══════════════════════════════════════════════════
  // LEVEL 5: Final Fallbacks
  // ═══════════════════════════════════════════════════
  setIfEmpty("title", document.title);

  // Try to derive site name from hostname
  if (!metadata.siteName) {
    const host = window.location.hostname.replace(/^www\./, "");
    const parts = host.split(".");
    if (parts.length >= 2) {
      metadata.siteName =
        parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
  }

  // Default source type
  if (metadata.sourceType === "unknown") {
    metadata.sourceType = "webpage";
  }

  // Store result on window so the background worker can read it
  // via a separate chrome.scripting.executeScript({ func }) call.
  (window as unknown as Record<string, unknown>).__citadorResult = metadata;
})();
