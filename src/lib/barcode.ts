/**
 * Normalizes a scanned barcode / invoice GTIN to a comparable canonical form
 * so a scan can be matched against an invoice line item's stored `gtin`
 * regardless of symbology quirks.
 *
 * Handles the two mismatches that actually show up in practice:
 * - EAN-13 vs UPC-A: scanners emit 13 digits (leading "0" + the 12-digit
 *   UPC), while invoice text sometimes has the bare 12-digit form. A "true"
 *   13-digit EAN (e.g. a Bookland/ISBN code on a graphic novel, prefix 978/979)
 *   isn't a disguised UPC, so it's left as-is.
 * - A trailing 5-digit supplemental "price add-on" symbol some scanners are
 *   configured to also read, appended after the primary code.
 */
export function normalizeGtin(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 17 || digits.length === 18) {
    // Primary code plus a 5-digit supplemental add-on — drop the add-on.
    digits = digits.slice(0, digits.length - 5);
  }
  if (digits.length === 13 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (digits.length === 12 || digits.length === 13) return digits;
  return null;
}
