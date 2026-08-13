// Every phone/WhatsApp field on the site is a South African mobile number,
// so the +27 country code is fixed rather than typed. A candidate only ever
// enters the 9 digits after it; components/PhoneInput.tsx is the input that
// enforces that. These two functions are the format the rest of the app
// reads and writes: "+27" followed by up to 9 digits, no spaces.

/** Strips everything that isn't a digit. */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * The 9 significant digits from any phone string, old or new. Handles
 * numbers already stored as "+27 82 123 4567", "082 123 4567", or a bare
 * "821234567" -- old data still displays cleanly in the +27-prefixed input.
 * Best effort, not validation.
 */
export function toSaLocalDigits(value: string | null | undefined): string {
  const raw = (value ?? '').trim();
  let digits = digitsOnly(raw);
  if (raw.startsWith('+27')) {
    // Always a country-code prefix here, regardless of how many local
    // digits follow -- this is what toSaPhone() emits on every keystroke,
    // so this branch can't gate on total length like the others below.
    digits = digits.slice(2);
  } else if (digits.startsWith('27') && digits.length > 9) digits = digits.slice(2);
  else if (digits.startsWith('0') && digits.length === 10) digits = digits.slice(1);
  return digits.slice(0, 9);
}

/** Combines the 9 local digits back into the stored "+27XXXXXXXXX" form. */
export function toSaPhone(localDigits: string): string {
  const digits = digitsOnly(localDigits).slice(0, 9);
  return digits ? `+27${digits}` : '';
}
