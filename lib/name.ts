// candidate_profiles.full_name stays one column in the database -- every
// other reader (dashboard, CandidateSearch.tsx, emails, the profile preview
// page) just wants one display string, and a schema split would ripple into
// all of them for no real benefit. The three forms that actually collect a
// name (register, onboarding, profile) instead show two inputs and join them
// here before writing, splitting an existing value back apart for editing.

export function joinFullName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
}

/** Best effort: everything before the first space is the first name, the
 * rest is the last name. Wrong for some names (double-barrelled surnames,
 * single names), but it is an editable starting point, not a final answer. */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex === -1) return { firstName: trimmed, lastName: '' };
  return {
    firstName: trimmed.slice(0, spaceIndex),
    lastName: trimmed.slice(spaceIndex + 1).trim(),
  };
}
