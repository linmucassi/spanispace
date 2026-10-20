// South African ID number parsing: YYMMDD SSSS C A Z (13 digits), where Z is
// a Luhn check digit. Used only to derive a date of birth for the 18+ check
// -- the ID number itself is never stored (see add-service-marketplace.sql).

export type SaIdResult =
  | { ok: true; dateOfBirth: string } // YYYY-MM-DD
  | { ok: false; error: string };

function luhnValid(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export function parseSaId(raw: string, today: Date = new Date()): SaIdResult {
  const id = raw.replace(/\s+/g, '');
  if (!/^\d{13}$/.test(id)) return { ok: false, error: 'An SA ID number has 13 digits.' };
  if (!luhnValid(id)) return { ok: false, error: 'That ID number is not valid. Please check it.' };

  const yy = Number(id.slice(0, 2));
  const mm = Number(id.slice(2, 4));
  const dd = Number(id.slice(4, 6));
  // Two-digit year: anything after this year's YY must be the 1900s.
  const currentYY = today.getFullYear() % 100;
  const year = yy > currentYY ? 1900 + yy : 2000 + yy;

  const dob = new Date(Date.UTC(year, mm - 1, dd));
  if (dob.getUTCFullYear() !== year || dob.getUTCMonth() !== mm - 1 || dob.getUTCDate() !== dd) {
    return { ok: false, error: 'That ID number does not contain a valid date of birth.' };
  }
  return { ok: true, dateOfBirth: dob.toISOString().slice(0, 10) };
}

export function ageOn(dateOfBirth: string, today: Date = new Date()): number {
  const [y, m, d] = dateOfBirth.split('-').map(Number);
  let age = today.getFullYear() - y;
  const beforeBirthday = today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}
