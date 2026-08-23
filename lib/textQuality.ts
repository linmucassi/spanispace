// Fixes and guards against a specific, pervasive encoding corruption found
// live in the jobs table on 23 Aug 2026: somewhere in the scraper pipeline,
// multi-byte UTF-8 sequences (en-dashes, smart quotes, accented letters,
// CJK characters -- anything outside plain ASCII) get read byte-by-byte as
// Latin-1 codepoints. This doesn't just affect foreign-script postings
// (a real example found live: a Chinese-language Volkswagen China /
// Meituan job posting) -- it silently mangles ordinary English text too,
// e.g. a real en-dash in "1-3+ years" corrupted into invisible C1 control
// characters that render as visible garbage around the digits.
//
// Detection is precise: legitimate text never contains raw C1 control
// characters (U+0080-U+009F) -- they're pure control codes with no display
// purpose. Their presence is a reliable, low-false-positive signal that a
// UTF-8 sequence got misread this way (continuation bytes of any
// multi-byte UTF-8 character fall in 0x80-0xBF, which overlaps the C1
// block). Built via String.fromCharCode rather than a regex literal or
// \\u escape sequence, since both have been silently mangled by this
// session's file-write tooling before -- exactly the kind of bug this
// feature exists to catch, so it gets the most defensive construction.
const C1_CONTROL_RANGE = new RegExp('[' + String.fromCharCode(0x80) + '-' + String.fromCharCode(0x9f) + ']');

// After repair, genuine CJK/Hiragana-Katakana/Hangul/Arabic/Cyrillic
// content is foreign-script, not corrupted -- not relevant for this
// SA-audience job board (matches the pre-existing "reject non-Latin
// script" policy), so it's reported separately rather than silently
// "fixed" into unrelated content.
const FOREIGN_SCRIPT = new RegExp(
  '[' +
    String.fromCharCode(0x4e00) + '-' + String.fromCharCode(0x9fff) + // CJK Unified
    String.fromCharCode(0x3040) + '-' + String.fromCharCode(0x30ff) + // Hiragana/Katakana
    String.fromCharCode(0xac00) + '-' + String.fromCharCode(0xd7af) + // Hangul
    String.fromCharCode(0x0600) + '-' + String.fromCharCode(0x06ff) + // Arabic
    String.fromCharCode(0x0400) + '-' + String.fromCharCode(0x04ff) + // Cyrillic
  ']'
);

export function hasEncodingCorruption(text: string | null | undefined): boolean {
  if (!text) return false;
  return C1_CONTROL_RANGE.test(text);
}

export interface RepairResult {
  text: string;
  wasCorrupted: boolean;
  isForeignScript: boolean;
}

// Re-interprets each character as the raw byte it actually was, then
// re-decodes those bytes as UTF-8 -- reversing the exact corruption
// described above. Safe no-op on text that was never corrupted.
export function repairEncoding(text: string | null | undefined): RepairResult {
  if (!text || !hasEncodingCorruption(text)) {
    return { text: text ?? '', wasCorrupted: false, isForeignScript: false };
  }
  try {
    const repaired = Buffer.from(text, 'latin1').toString('utf8');
    // A failed/lossy decode replaces bad sequences with the Unicode
    // replacement character -- that's not what a real round-trip
    // produces, so the text is corrupted in some way this specific
    // repair can't reverse. Leave it as-is rather than risk making it
    // worse.
    if (repaired.includes(String.fromCharCode(0xfffd))) {
      return { text, wasCorrupted: true, isForeignScript: false };
    }
    return { text: repaired, wasCorrupted: true, isForeignScript: FOREIGN_SCRIPT.test(repaired) };
  } catch {
    return { text, wasCorrupted: true, isForeignScript: false };
  }
}

// Kept for the two read-time/write-time gates that only need a yes/no
// verdict on script relevance, not the repaired text itself.
export function isMojibake(text: string | null | undefined): boolean {
  return repairEncoding(text).isForeignScript;
}
