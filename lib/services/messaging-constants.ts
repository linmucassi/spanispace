// Client-safe messaging limits. Kept apart from lib/services/messaging.ts,
// which imports the service-role client and must never reach the browser.

export const MAX_MESSAGES_PER_MINUTE = 20;
export const MAX_THREADS_PER_REQUEST = 10;
// Violations in 7 days before the account is flagged for admin review.
export const VIOLATION_FLAG_THRESHOLD = 3;
