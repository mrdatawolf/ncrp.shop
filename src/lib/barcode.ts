/**
 * Parses a scanned barcode or an invoice-stored GTIN into its comic-specific
 * components: the 12-digit UPC-A (identifies the series/title) and, when
 * present, the 5-digit supplemental add-on. The add-on is not a price code —
 * per industry convention it encodes the issue number within the barcode
 * year (digits 1-3), the cover variant (digit 4), and the printing (digit
 * 5). That means the add-on is what actually distinguishes one issue/variant
 * from another; the 12-digit UPC alone only identifies the title.
 *
 * Handles the two format mismatches that show up in practice:
 * - EAN-13 vs UPC-A: scanners emit a leading "0" + the 12-digit UPC, while
 *   invoice text sometimes has the bare 12-digit form. A "true" 13-digit EAN
 *   not starting with "0" (e.g. a Bookland/ISBN code on a graphic novel)
 *   isn't a disguised UPC, so it's kept as-is with no add-on.
 * - A single scan of the full barcode block comes back as 17 or 18 digits
 *   (primary + add-on read together).
 */
export type ParsedGtin = {
  primary: string;
  addon: string | null;
};

export function parseGtin(raw: string): ParsedGtin | null {
  let digits = raw.replace(/\D/g, "");
  let addon: string | null = null;

  if (digits.length === 17 || digits.length === 18) {
    addon = digits.slice(-5);
    digits = digits.slice(0, -5);
  }
  if (digits.length === 13 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (digits.length !== 12 && digits.length !== 13) return null;

  return { primary: digits, addon };
}

export type GtinMatchKind = "exact" | "primary-only" | "none";

/**
 * "exact": same title and the add-on matched too — same issue/variant/printing.
 * "primary-only": same title, but at least one side has no add-on to compare
 *   — could be the same issue, could be a different one on the same series;
 *   needs disambiguation rather than being treated as a confirmed match.
 * "none": different titles, or both sides have an add-on and they differ.
 */
export function matchGtins(a: ParsedGtin, b: ParsedGtin): GtinMatchKind {
  if (a.primary !== b.primary) return "none";
  if (a.addon && b.addon) return a.addon === b.addon ? "exact" : "none";
  return "primary-only";
}
