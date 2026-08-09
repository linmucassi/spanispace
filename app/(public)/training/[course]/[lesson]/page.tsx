import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { academy } from '@/data/academy';
import {
  COURSES,
  getCourse,
  getLesson,
  lessonHref,
  lessonNeighbours,
  lessonSlug,
  readingMinutes,
} from '@/data/courses';
import { Inline, Prose } from '@/components/Prose';
import T from '@/components/T';

type Props = { params: Promise<{ course: string; lesson: string }> };

export function generateStaticParams() {
  return COURSES.flatMap((course) =>
    course.lessons.map((lesson) => ({ course: course.slug, lesson: lessonSlug(lesson) }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { course: courseSlug, lesson: lessonParam } = await params;
  const course = getCourse(courseSlug);
  const lesson = course && getLesson(course, lessonParam);
  if (!course || !lesson) return {};
  return {
    title: `${lesson.title}, ${course.title}`,
    // The hook is one plain sentence, which is exactly what a search result wants.
    description: lesson.hookHtml.replace(/<[^>]+>/g, ''),
    alternates: { canonical: lessonHref(course, lesson) },
  };
}

export default async function LessonPage({ params }: Props) {
  const { course: courseSlug, lesson: lessonParam } = await params;
  const course = getCourse(courseSlug);
  if (!course) notFound();
  const lesson = getLesson(course, lessonParam);
  if (!lesson) notFound();

  const { index, previous, next } = lessonNeighbours(course, lesson);
  const position = index + 1;
  const total = course.lessons.length;

  return (
    <article className="pt-16">
      {/* The only chrome on the page: where you are, and the way back. */}
      <div className="sticky top-16 z-30 bg-white/90 backdrop-blur border-b border-ink-200">
        <div className="max-w-2xl mx-auto px-4 flex items-center gap-4 py-3">
          <Link
            href={`/training/${course.slug}`}
            className="text-sm text-ink-500 hover:text-brand-600 transition-colors truncate"
          >
            &larr; {course.title}
          </Link>
          <span className="ml-auto text-xs font-mono text-ink-400 whitespace-nowrap tabular-nums">
            <T k="course.position" vars={{ n: position, total }} />
          </span>
        </div>
        <div
          className="h-0.5 bg-brand-600"
          style={{ width: `${(position / total) * 100}%` }}
          role="progressbar"
          aria-valuenow={position}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={`Lesson ${position} of ${total}`}
        />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 md:py-14">
        <p className="font-mono text-sm font-bold text-brand-600 tabular-nums">
          {String(lesson.number).padStart(2, '0')}
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-ink-900 tracking-tight leading-tight mt-2">
          {lesson.title}
        </h1>
        <p className="font-serif italic text-lg text-ink-700 mt-5">
          <Inline html={lesson.hookHtml} />
        </p>
        <p className="text-xs text-ink-400 mt-4">
          <T k="course.minRead" vars={{ n: readingMinutes(lesson) }} />
        </p>

        <div className="bg-ink-50 border border-ink-200 rounded-2xl p-5 mt-8">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-400 mb-2">
            <T k="course.outcomes" />
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-ink-700">
            {lesson.outcomes.map((outcome, i) => (
              <li key={i}>
                <Inline html={outcome} />
              </li>
            ))}
          </ul>
        </div>

        {/* Held to a comfortable measure with generous spacing, because the same
            words on a narrower line with room to breathe read as half as long. */}
        <Prose
          html={lesson.bodyHtml}
          className="mt-8 text-[17px] leading-8 text-ink-700 [&_p]:mb-6 [&_strong]:text-ink-900 [&_a]:text-brand-600 [&_a]:underline"
        />

        {lesson.keyTerms.length > 0 && (
          <div className="mt-10 pt-6 border-t border-ink-200">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-400 mb-4">
              <T k="course.keyTerms" />
            </p>
            <dl className="space-y-3">
              {lesson.keyTerms.map((term, i) => (
                <div key={i}>
                  <dt className="font-semibold text-ink-900 text-sm">{term.term}</dt>
                  <dd className="text-sm text-ink-600">
                    <Inline html={term.planHtml} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {lesson.activityHtml && (
          <div className="mt-8 bg-brand-50 border border-brand-100 rounded-2xl p-5">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-600 mb-1.5">
              <T k="course.activity" />
            </p>
            <p className="text-sm text-ink-700 leading-relaxed">
              <Inline html={lesson.activityHtml} />
            </p>
          </div>
        )}

        {/* The closing letter used to sit at the bottom of the one long page,
            where almost nobody reached it. It belongs here, at the finish. */}
        {!next && (
          <div className="mt-12 bg-ink-900 text-white rounded-3xl p-7 md:p-10">
            <p className="text-xs font-mono font-bold uppercase tracking-[0.16em] text-brand-400 mb-4">
              <T k="course.finished" vars={{ course: course.title }} />
            </p>
            <div
              className="text-ink-200 leading-relaxed [&_p]:mb-4 [&_strong]:text-white"
              dangerouslySetInnerHTML={{ __html: academy.spine.closingHtml }}
            />
            <div className="flex flex-wrap gap-3 mt-7">
              <Link
                href="/training/career-tracks"
                className="bg-white text-ink-900 font-bold px-5 py-3 rounded-xl hover:bg-brand-50 transition-colors"
              >
                <T k="course.pickTrack" />
              </Link>
              <Link
                href="/jobs"
                className="border border-white/20 text-white font-bold px-5 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                <T k="course.browseJobs" />
              </Link>
            </div>
          </div>
        )}

        <nav className="flex items-stretch gap-3 mt-10" aria-label="Lesson navigation">
          {previous ? (
            <Link
              href={lessonHref(course, previous)}
              className="flex-1 border border-ink-200 rounded-2xl p-4 hover:border-brand-400 transition-colors"
            >
              <span className="block text-xs text-ink-400">&larr; <T k="course.previous" /></span>
              <span className="block text-sm font-semibold text-ink-800 mt-1 line-clamp-2">
                {previous.title}
              </span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
          {next && (
            <Link
              href={lessonHref(course, next)}
              className="flex-1 bg-ink-900 text-white rounded-2xl p-4 hover:bg-ink-800 transition-colors text-right"
            >
              <span className="block text-xs text-ink-400"><T k="course.next" /> &rarr;</span>
              <span className="block text-sm font-semibold mt-1 line-clamp-2">{next.title}</span>
            </Link>
          )}
        </nav>
      </div>
    </article>
  );
}
