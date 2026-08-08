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
import { formatMinutes } from '@/lib/format-duration';
import { accessLabel } from '@/lib/training-level';
import { Inline, Prose } from '@/components/Prose';
import T from '@/components/T';

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

  return (
    <div className="pt-16">
      {/* Everything a reader needs to decide, above the fold, in five lines. */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
          <Link
            href="/training"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            &larr; <T k="course.back" />
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mt-4">{course.title}</h1>
          <p className="text-lg text-slate-300 mt-3">{course.promise}</p>
          <p className="text-sm text-slate-400 mt-1">{course.forWho}</p>

          <p className="text-sm text-slate-400 mt-6">
            <T k="course.lessons" vars={{ n: course.lessons.length }} /> ·{' '}
            <T k="course.read" vars={{ d: formatMinutes(courseMinutes(course)) }} /> ·{' '}
            <span className={accessLabel(course.level) === 'Free' ? 'text-emerald-400' : ''}>
              <T k={accessLabel(course.level) === 'Free' ? 'course.free' : 'course.paid'} />
            </span>{' '}
            · <T k="course.selfPaced" />
          </p>

          {first && (
            <Link
              href={lessonHref(course, first)}
              className="inline-block mt-7 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-bold px-7 py-3.5 rounded-xl"
            >
              <T k="course.start" />
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
                className="group flex items-start gap-4 bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-400 transition-colors"
              >
                <span className="font-mono text-sm font-bold text-indigo-600 tabular-nums pt-0.5">
                  {String(lesson.number).padStart(2, '0')}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-slate-900 leading-snug group-hover:text-indigo-600">
                    {lesson.title}
                  </span>
                  <span className="block text-sm text-slate-500 mt-1">
                    <Inline html={lesson.hookHtml} />
                  </span>
                </span>
                <span className="text-xs text-slate-400 whitespace-nowrap pt-0.5">
                  <T k="course.min" vars={{ n: readingMinutes(lesson) }} />
                </span>
              </Link>
            </li>
          ))}
        </ol>

        {/* The long welcome used to be the first thing on the page and it sent
            people away. It is worth reading, so it stays, one tap off the path. */}
        <details className="group mt-8 bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <summary className="flex items-center gap-3 p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden font-semibold text-slate-900">
            <span className="flex-1">
              <T k="course.aboutTitle" />
            </span>
            <span className="text-slate-300 text-2xl leading-none transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <div className="px-5 pb-6 border-t border-slate-100 pt-5">
            <Prose html={academy.spine.programIntroHtml} className="[&_a]:text-indigo-600" />
          </div>
        </details>
      </section>
    </div>
  );
}
