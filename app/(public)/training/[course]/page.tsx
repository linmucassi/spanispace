import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { academy } from '@/data/academy';
import {
  COURSES,
  courseMinutes,
  getCourse,
  lessonHref,
  readingMinutes,
} from '@/data/courses';
import { accessLabel } from '@/lib/training-level';
import { Inline, Prose } from '@/components/Prose';
import T from '@/components/T';
import { createServerSupabase } from '@/lib/supabase/server';

type Props = { params: Promise<{ course: string }> };

export function generateStaticParams() {
  return COURSES.map((course) => ({ course: course.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { course: slug } = await params;
  const course = getCourse(slug);
  if (!course) return {};
  return {
    title: `${course.title}, ${course.lessons.length} lessons`,
    description: `${course.promise} ${course.forWho} Free, self paced, in plain language with South African examples.`,
    alternates: { canonical: `/training/${course.slug}` },
  };
}

export default async function CoursePage({ params }: Props) {
  const { course: slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  const first = course.lessons[0];

  // Full lesson content requires signing in (see [lesson]/page.tsx). This page
  // still shows the same teaser it always has -- title, lesson titles, blurb
  // -- for everyone, but the CTA and the per-lesson checkmarks are only
  // meaningful once we know who is reading.
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  let completedLessons = new Set<number>();
  if (user && supabase) {
    const { data: progress } = await supabase
      .from('academy_lesson_progress')
      .select('lesson_number')
      .eq('user_id', user.id)
      .eq('course_slug', course.slug);
    completedLessons = new Set((progress ?? []).map((p) => p.lesson_number));
  }
  const completedCount = completedLessons.size;

  return (
    <div className="pt-16">
      {/* Everything a reader needs to decide, above the fold, in five lines. */}
      <section className="bg-ink-900 text-white">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
          <Link
            href="/training"
            className="text-sm text-ink-400 hover:text-white transition-colors"
          >
            &larr; <T k="course.back" />
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mt-4">{course.title}</h1>
          <p className="text-lg text-ink-300 mt-3">{course.promise}</p>
          <p className="text-sm text-ink-400 mt-1">{course.forWho}</p>

          <p className="text-sm text-ink-400 mt-6">
            <T k="course.lessons" vars={{ n: course.lessons.length }} /> ·{' '}
            <T k="course.minRead" vars={{ n: courseMinutes(course) }} /> ·{' '}
            <span className={accessLabel(course.level) === 'Free' ? 'text-emerald-400' : ''}>
              <T k={accessLabel(course.level) === 'Free' ? 'course.free' : 'course.paid'} />
            </span>{' '}
            · <T k="course.selfPaced" />
          </p>

          {user && completedCount > 0 && (
            <p className="text-sm text-emerald-400 mt-2">
              <T k="course.lessonsComplete" vars={{ n: completedCount, total: course.lessons.length }} />
            </p>
          )}

          {user ? (
            first && (
              <Link
                href={lessonHref(course, first)}
                className="inline-block mt-7 bg-brand-600 hover:bg-brand-500 transition-colors text-white font-bold px-7 py-3.5 rounded-xl"
              >
                <T k="course.start" />
              </Link>
            )
          ) : (
            <Link
              href="/login"
              className="inline-block mt-7 bg-brand-600 hover:bg-brand-500 transition-colors text-white font-bold px-7 py-3.5 rounded-xl"
            >
              <T k="course.signInToStart" />
            </Link>
          )}
        </div>
      </section>

      {/* The lesson list. Each row is one tap to one lesson on its own page. */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <ol className="space-y-2">
          {course.lessons.map((lesson) => (
            <li key={lesson.number}>
              <Link
                href={lessonHref(course, lesson)}
                className="group flex items-start gap-4 bg-white border border-ink-200 rounded-2xl p-5 hover:border-brand-400 transition-colors"
              >
                <span className="font-mono text-sm font-bold text-brand-600 tabular-nums pt-0.5">
                  {String(lesson.number).padStart(2, '0')}
                </span>
                <span className="flex-1 min-w-0">
                  {lesson.eyebrow && (
                    <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-brand-600 mb-0.5">
                      {lesson.eyebrow}
                    </span>
                  )}
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-ink-900 leading-snug group-hover:text-brand-600">
                      {lesson.title}
                    </span>
                    {completedLessons.has(lesson.number) && (
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                        <T k="course.done" />
                      </span>
                    )}
                  </span>
                  <span className="block text-sm text-ink-500 mt-1 line-clamp-2">
                    <Inline html={lesson.hookHtml} />
                  </span>
                </span>
                <span className="text-xs text-ink-400 whitespace-nowrap pt-0.5">
                  <T k="course.min" vars={{ n: readingMinutes(lesson) }} />
                </span>
              </Link>
            </li>
          ))}
        </ol>

        {/* The long welcome used to be the first thing on the page and it sent
            people away. It is worth reading, so it stays, one tap off the path. */}
        <details className="group mt-8 bg-white border border-ink-200 rounded-2xl overflow-hidden">
          <summary className="flex items-center gap-3 p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden font-semibold text-ink-900">
            <span className="flex-1">
              <T k="course.aboutTitle" />
            </span>
            <span className="text-ink-300 text-2xl leading-none transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <div className="px-5 pb-6 border-t border-ink-100 pt-5">
            <Prose html={academy.spine.programIntroHtml} className="[&_a]:text-brand-600" />
          </div>
        </details>
      </section>
    </div>
  );
}
