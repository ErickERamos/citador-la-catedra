/**
 * Content script: Hierarchical metadata extractor.
 * Injected on-demand via chrome.scripting.executeScript.
 * Returns a PageMetadata object to the caller.
 *
 * Priority: JSON-LD > Open Graph > Meta Tags > Fallback
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
  // LEVEL 4: Fallback
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
