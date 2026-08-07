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
