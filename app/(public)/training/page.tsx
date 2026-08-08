import type { Metadata } from 'next';
import TrainingSection, { type CourseMeta } from '@/components/TrainingSection';
import { COURSES, GUIDES, courseMinutes } from '@/data/courses';

export const metadata: Metadata = {
  title: 'Training, free courses you can start today',
  description:
    'Every SpaniSpace course in one place. Bootcamps, short courses and certificates, in plain language with South African examples. Beginner courses are free.',
  alternates: { canonical: '/training' },
};

export default function TrainingPage() {
  // Worked out here rather than in the catalogue component, because reading a
  // course length means reading data/academy.ts, and that file is a large body
  // of lesson prose that has no business in the browser bundle.
  const courseMeta: Record<string, CourseMeta> = Object.fromEntries(
    COURSES.map((course) => [
      course.slug,
      { lessons: course.lessons.length, minutes: courseMinutes(course) },
    ])
  );

  return (
    <div className="pt-16">
      <TrainingSection courseMeta={courseMeta} guides={GUIDES} />
    </div>
  );
}
