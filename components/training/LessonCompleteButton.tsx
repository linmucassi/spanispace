'use client';

import { useState, useTransition } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

export default function LessonCompleteButton({
  courseSlug,
  lessonNumber,
  initialCompleted,
}: {
  courseSlug: string;
  lessonNumber: number;
  initialCompleted: boolean;
}) {
  const { t } = useTranslation();
  const [completed, setCompleted] = useState(initialCompleted);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const next = !completed;
    setCompleted(next);
    startTransition(async () => {
      try {
        const res = await fetch('/api/academy-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseSlug, lessonNumber, completed: next }),
        });
        if (!res.ok) setCompleted(!next);
      } catch {
        setCompleted(!next);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
        completed
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
          : 'bg-ink-900 text-white hover:bg-ink-800'
      }`}
    >
      <Check className={`h-4 w-4 ${completed ? 'opacity-100' : 'opacity-50'}`} />
      {completed ? t('course.completed') : t('course.markComplete')}
    </button>
  );
}
