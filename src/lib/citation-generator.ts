import type {
  PageMetadata,
  AuthorDisplayMode,
  CitationResult,
  CitationFormat,
} from "./types";
import {
  Apa7Strategy,
  MlaStrategy,
  ChicagoStrategy,
  HarvardStrategy,
  UneIso690Strategy,
  IeeeStrategy,
  VancouverStrategy,
  Iso690Strategy,
  LatinoStrategy,
} from "./citation-strategies";

/**
 * Citation Generator.
 *
 * Supports multiple formats:
 * - APA 7th Edition (Spanish)
 * - MLA
 * - Chicago (Author-Date)
 * - Harvard
 * - UNE-ISO 690
 * - IEEE
 * - Vancouver
 * - ISO 690
 * - Sistema Latino
 */
export class CitationGenerator {
  /**
   * Generate both citation formats from extracted metadata.
   */
  static generate(
    metadata: PageMetadata,
    mode: AuthorDisplayMode,
    format: CitationFormat = "apa7"
  ): CitationResult {
    switch (format) {
      case "mla":
        return new MlaStrategy().generate(metadata, mode);
      case "chicago":
        return new ChicagoStrategy().generate(metadata, mode);
      case "harvard":
        return new HarvardStrategy().generate(metadata, mode);
      case "une-iso-690":
        return new UneIso690Strategy().generate(metadata, mode);
      case "ieee":
        return new IeeeStrategy().generate(metadata, mode);
      case "vancouver":
        return new VancouverStrategy().generate(metadata, mode);
      case "iso-690":
        return new Iso690Strategy().generate(metadata, mode);
      case "latino":
        return new LatinoStrategy().generate(metadata, mode);
      case "apa7":
      default:
        return new Apa7Strategy().generate(metadata, mode);
    }
  }
}
