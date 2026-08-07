// The SpaniSpace course access policy, in one place.
//
// Issue #6: beginner courses are free, advanced courses are paid. The rule is
// expressed once here and derived everywhere else, so a form, a seed file or a
// hand written row can never put a price on a beginner course by accident.
// The database enforces the same rule in supabase/add-training-levels.sql.

export const TRAINING_LEVELS = ['Beginner', 'Advanced'] as const;

export type TrainingLevel = (typeof TRAINING_LEVELS)[number];

/** The whole policy. Everything else in this file reads from it. */
export function isFreeLevel(level: TrainingLevel): boolean {
  return level === 'Beginner';
}

/** What a candidate pays SpaniSpace for a course we host ourselves. */
export function accessLabel(level: TrainingLevel): 'Free' | 'Paid' {
  return isFreeLevel(level) ? 'Free' : 'Paid';
}

/** One line of plain copy explaining the policy, used under form controls. */
export function accessHelp(level: TrainingLevel): string {
  return isFreeLevel(level)
    ? 'Beginner courses are free for candidates. You cannot charge for this one.'
    : 'Advanced courses are paid. Candidates are billed by the provider running the course.';
}

export function isTrainingLevel(value: unknown): value is TrainingLevel {
  return TRAINING_LEVELS.includes(value as TrainingLevel);
}

/** Fallback for legacy rows written before the level column existed. */
export function levelFromIsFree(isFree: boolean | null | undefined): TrainingLevel {
  return isFree === false ? 'Advanced' : 'Beginner';
}

type WriteError = { code?: string; message?: string } | null;

/**
 * True when supabase/add-training-levels.sql has not been run yet, so the level
 * column is not there. Deploys land before migrations do, and a company should
 * not lose a submission in that window. Callers retry without the column, and
 * is_free is still set from the level either way, so the rule holds regardless.
 */
export function isMissingLevelColumn(error: WriteError): boolean {
  if (!error) return false;
  // PGRST204 is PostgREST's schema cache miss, 42703 is Postgres undefined_column.
  const code = error.code ?? '';
  const message = (error.message ?? '').toLowerCase();
  return (code === 'PGRST204' || code === '42703') && message.includes('level');
}

/** The same row without the level column, for the retry above. */
export function withoutLevel<T extends Record<string, unknown>>(row: T): Omit<T, 'level'> {
  const rest: Record<string, unknown> = { ...row };
  delete rest.level;
  return rest as Omit<T, 'level'>;
}
