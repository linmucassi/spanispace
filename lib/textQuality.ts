// Catches mojibake -- text in a script irrelevant to this SA-audience job
// board (CJK, Cyrillic, Arabic, Hangul, etc.) that got misread as
// Latin-1/CP1252 somewhere upstream (a scraper source not honouring its own
// charset header, for example) and re-encoded. The result lands entirely
// within the Latin-1 Supplement block, which is exactly the range this
// codebase's existing "reject non-Latin characters" filters
// (lib/scrapers/db-writer.ts's isLatinJob, lib/publicJobs.ts's
// isEnglishReadable) already allow through -- so genuinely garbled text
// like "æ°åªä½è¿" slips past them untouched. Found 2 such rows live
// (a Volkswagen China and a Meituan posting) on 23 Aug 2026.
//
// Detection: reinterpret each character as a single raw byte (what
// actually happened during the original corruption), then try to decode
// those bytes as UTF-8. If that recovers real CJK/Cyrillic/Arabic/Hangul
// text, the input was mojibake of exactly that script.
const RECOVERED_FOREIGN_SCRIPT = /[一-鿿぀-ヿ가-힯؀-ۿЀ-ӿ]/;

export function isMojibake(text: string | null | undefined): boolean {
  if (!text) return false;
  let redecoded: string;
  try {
    redecoded = Buffer.from(text, 'latin1').toString('utf8');
  } catch {
    return false;
  }
  // A failed/lossy UTF-8 decode replaces bad sequences with U+FFFD -- that's
  // not what a real mojibake round-trip produces, so treat it as "not
  // mojibake" rather than risk a false positive.
  if (redecoded.includes('�')) return false;
  return RECOVERED_FOREIGN_SCRIPT.test(redecoded);
}
