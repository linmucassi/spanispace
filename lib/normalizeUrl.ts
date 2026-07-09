// Browsers reject a bare `type="url"` input like "linkedin.com/x" (no scheme)
// with a native "Please enter a URL" tooltip that silently blocks form
// submission -- the JS onSubmit handler never even runs. We use type="text"
// instead and normalize on save so a scheme-less URL still gets stored
// correctly rather than either blocking the form or being saved broken.
export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
