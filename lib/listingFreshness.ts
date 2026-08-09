// Shared "expiring soon" threshold — used by the admin jobs list badge, the
// public Jobs Board badge, and scripts/run-expiry-alerts.ts, so all three
// agree on what "soon" means.

export const EXPIRING_SOON_DAYS = 7;

export function isExpiringSoon(expiryDate: string): boolean {
  const diffDays = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= EXPIRING_SOON_DAYS;
}

export function relativeDaysAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}
