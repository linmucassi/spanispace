// Detects contact details and attempts to move a conversation off-platform.
// Spec: docs/project-details.md §7.6.
//
// One module, used in three places so the rules never drift:
//   * server-side on every provider profile field (S1, /api/services/provider)
//   * server-side on every service chat message before the booking fee is
//     paid (S3) -- the server check is the real enforcement
//   * client-side as a live warning while typing (UX only, bypassable)
//
// Tested by scripts/test-contact-guard.ts (npx tsx scripts/test-contact-guard.ts).
// When adding a rule, add both a string it must block and an ordinary
// job-chat string it must NOT block -- false positives on prices, sizes,
// dates and times would make the chat unusable.

export type ContactReason = 'phone' | 'email' | 'link' | 'handle' | 'off_platform';

export interface ContactScan {
  blocked: boolean;
  reasons: ContactReason[];
}

const NUMBER_WORDS: Record<string, string> = {
  zero: '0', oh: '0', o: '0', nought: '0', nil: '0',
  one: '1', two: '2', three: '3', four: '4', five: '5',
  six: '6', seven: '7', eight: '8', nine: '9',
  // isiZulu
  iqanda: '0', kunye: '1', kubili: '2', kuthathu: '3', kune: '4', kuhlanu: '5',
  isithupha: '6', isikhombisa: '7', isishiyagalombili: '8', isishiyagalolunye: '9',
};

// Turns "zero eight two", "o82", "double seven" etc. into digits so the
// phone check sees what a person would read.
function wordsToDigits(text: string): string {
  let out = text.replace(/\b(double|triple)\s+([a-z0-9]+)\b/g, (match, mult: string, word: string) => {
    const digit = /^\d$/.test(word) ? word : NUMBER_WORDS[word];
    if (!digit) return match;
    return digit.repeat(mult === 'double' ? 2 : 3);
  });
  out = out.replace(/\b[a-z]+\b/g, (word) => NUMBER_WORDS[word] ?? word);
  // Look-alike letters, only inside tokens that already contain a digit
  // ("o82", "07l") so ordinary words are untouched.
  out = out.replace(/\b(?=[a-z0-9]*\d)[a-z0-9]+\b/g, (token) =>
    token.replace(/o/g, '0').replace(/[li]/g, '1'),
  );
  return out;
}

function hasPhoneNumber(lower: string): boolean {
  let text = wordsToDigits(lower);
  // Dates and date ranges ("2026/10/20 - 2026/10/22") would otherwise merge
  // into long digit runs that contain phone-shaped substrings.
  text = text
    .replace(/\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/g, ' date ')
    .replace(/\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/g, ' date ');
  // SA numbers: 0 + 9 digits, or 27 + 9 digits, where the first digit after
  // the prefix is 1-8 (landlines 01x-05x, mobiles 06x-08x).
  const PHONE = /^(?:0[1-8]\d{8}|27[1-8]\d{8})$/;
  const PHONE_INSIDE = /(?:0[1-8]\d{8}|27[1-8]\d{8})/;
  // Digit groups joined only by separators: "082 123-4567", "(082) 123.4567",
  // "0 8 2 1 2 3 4 5 6 7". A phone must start and end on a group boundary,
  // so a list of prices ("1500 2000 2500 3000") never matches by accident.
  const sequences = text.match(/\d+(?:[\s.\-/()\\_*+,]+\d+)*/g) ?? [];
  for (const sequence of sequences) {
    const groups = sequence.split(/\D+/).filter(Boolean);
    for (let i = 0; i < groups.length; i++) {
      // One long unbroken run ("90821234567"): look inside it.
      if (groups[i].length >= 10 && PHONE_INSIDE.test(groups[i])) return true;
      let joined = '';
      for (let j = i; j < groups.length; j++) {
        joined += groups[j];
        if (joined.length > 11) break;
        if (PHONE.test(joined)) return true;
      }
    }
  }
  return false;
}

const MAIL_PROVIDERS = 'gmail|googlemail|yahoo|ymail|outlook|hotmail|live|icloud|webmail|mweb|telkomsa|vodamail|iafrica|proton|protonmail';

function hasEmail(lower: string): boolean {
  const text = lower
    .replace(/\s*[[({<]\s*(?:at|@)\s*[\])}>]\s*/g, '@')
    .replace(/\s*[[({<]\s*dot\s*[\])}>]\s*/g, '.')
    .replace(/\s+dot\s+/g, '.')
    .replace(/\s+at\s+(?=[a-z0-9-]+\.[a-z]{2,})/g, '@')
    .replace(/\s*@\s*/g, '@');
  if (/[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/.test(text)) return true;
  return new RegExp(`[a-z0-9._-]+\\s*(?:@|\\bat\\b)\\s*(?:${MAIL_PROVIDERS})\\b`).test(text);
}

const TLDS = 'com|co\\.za|org\\.za|org|net|io|me|app|link|info|biz|online|site|store|za|ly|page|shop';

function hasLink(lower: string): boolean {
  const text = lower.replace(/\s*[[({<]\s*dot\s*[\])}>]\s*/g, '.').replace(/\s+dot\s+/g, '.');
  if (/\bhttps?:\/\//.test(text) || /\bwww\s*\./.test(text)) return true;
  if (/\b(?:wa\.me|t\.me|bit\.ly|tinyurl|linktr\.ee|chat\.whatsapp|m\.me)\b/.test(text)) return true;
  // "thandipaints.co.za", or spaced out "thandipaints . com". A dot followed
  // by a space only (end of sentence, "3 days. Online payment") is not a
  // link, so the unspaced and both-sides-spaced forms are checked separately.
  if (new RegExp(`\\b[a-z0-9-]{2,}\\.(?:${TLDS})\\b`).test(text)) return true;
  return new RegExp(`\\b[a-z0-9-]{2,}\\s+\\.\\s+(?:${TLDS})\\b`).test(text);
}

function hasHandle(lower: string): boolean {
  // "@thandi_paints" -- but not an email address (word char before @), and
  // not "@8am" (handles start with a letter or underscore).
  return /(?:^|[\s(:,])@[a-z_][a-z0-9_.]{2,}/.test(lower);
}

const OFF_PLATFORM_PATTERNS: RegExp[] = [
  // Messaging/social apps named outright.
  /\b(?:whats\s*app|watsapp|whatsap|wapp|telegram|instagram|insta|facebook|fb|tiktok|snapchat|messenger|wechat|skype|linkedin|imo)\b/,
  /\bon\s+signal\b/,
  // "call me", "sms me", "email us"
  /\b(?:call|phone|ring|sms|text|buzz|beep|dm|inbox|email|e-mail|mail|reach)\s+(?:me|us)\b/,
  // "my number", "your cell", "my contact details". ("Address" is left out:
  // "I travel to your address" is ordinary bio text, and the full address
  // field is only shown after payment anyway.)
  /\b(?:my|ur|your|you'?re|yo)\s+(?:phone|cell|cellphone|mobile|number|nombolo|digits|contacts?|contact\s+details|email|e-mail|whatsapp)\b/,
  // "send me your number", "drop your digits"
  /\b(?:send|give|share|drop|forward|leave)\s+(?:me\s+|us\s+)?(?:your|ur|my|a)\s+(?:number|no|cell|contact|email|details|digits)\b/,
  // Paying or booking around the platform.
  /\b(?:pay|book|deal|hire)\s+(?:me\s+|us\s+)?(?:direct(?:ly)?|outside|privately)\b/,
  /\b(?:outside|off|without|skip|avoid|bypass)\s+(?:of\s+)?(?:the\s+)?(?:app|platform|site|website|spanispace|fee|fees|booking\s+fee)\b/,
  // isiZulu: "call me", "number", "phone"
  /\b(?:ngishayele|inombolo|nombolo|ucingo)\b/,
];

function hasOffPlatformAsk(lower: string): boolean {
  return OFF_PLATFORM_PATTERNS.some((re) => re.test(lower));
}

export function scanText(input: string | null | undefined): ContactScan {
  if (!input) return { blocked: false, reasons: [] };
  // Normalise unicode look-alikes (full-width digits, fancy @) first.
  const lower = input.normalize('NFKC').toLowerCase();
  const reasons: ContactReason[] = [];
  if (hasPhoneNumber(lower)) reasons.push('phone');
  if (hasEmail(lower)) reasons.push('email');
  if (hasLink(lower)) reasons.push('link');
  if (hasHandle(lower)) reasons.push('handle');
  if (hasOffPlatformAsk(lower)) reasons.push('off_platform');
  return { blocked: reasons.length > 0, reasons };
}

// Scans a new message on its own, then joined with the sender's previous
// messages (oldest first), to catch a number or email split across several
// sends ("082" ... "123" ... "4567"). Phrase-based reasons are only taken
// from the single-message scan, so an old "call me" can't keep blocking.
export function scanWithHistory(previous: string[], body: string): ContactReason[] {
  const single = scanText(body);
  if (single.blocked) return single.reasons;
  if (previous.length === 0) return [];
  const combined = scanText([...previous, body].join(' '));
  return combined.reasons.filter((r) => r === 'phone' || r === 'email');
}

// Scans several named fields at once; returns only the fields that failed.
export function scanFields(
  fields: Record<string, string | null | undefined>,
): { field: string; reasons: ContactReason[] }[] {
  return Object.entries(fields)
    .map(([field, value]) => ({ field, ...scanText(value) }))
    .filter((r) => r.blocked)
    .map(({ field, reasons }) => ({ field, reasons }));
}

const REASON_TEXT: Record<ContactReason, string> = {
  phone: 'a phone number',
  email: 'an email address',
  link: 'a link or website',
  handle: 'a social media handle',
  off_platform: 'a request to talk or pay outside Spanispace',
};

export function explainContactScan(reasons: ContactReason[]): string {
  const parts = reasons.map((r) => REASON_TEXT[r]);
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} or ${parts[parts.length - 1]}` : parts[0];
  return `This looks like it contains ${list}. Contact details can only be shared once a booking is confirmed and paid, so both of you stay protected.`;
}
