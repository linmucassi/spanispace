// The course registry, and the only place that decides what a course is called,
// which lessons sit inside it, and where each one lives on the site.
//
// Why this file exists. The academy used to be one page, twelve bootcamp
// modules plus a five module short course plus tracks plus salaries plus
// certifications plus case studies, all on a single scroll with the first
// module already open. Testers said it was too much to scan and left. So every
// course now gets its own page, and every lesson gets its own page under that,
// and a reader only ever sees one thing at a time.
//
// The teaching content still lives in data/academy.ts, which is generated and
// must not be hand edited. This file is the shape around it, and slugs and
// reading times are derived rather than typed, so adding a module to the
// generated file publishes a new lesson page on its own.

import { academy, type AcademyModule } from './academy';
import type { TrainingLevel } from '../lib/training-level';

export interface Course {
  slug: string;
  title: string;
  /** The one line that carries the card and sits under the title. Keep it short. */
  promise: string;
  /** Who it is for, one line, so a reader can rule themselves in or out fast. */
  forWho: string;
  /** Beginner is free, Advanced is paid. See lib/training-level.ts. */
  level: TrainingLevel;
  lessons: AcademyModule[];
}

export const COURSES: Course[] = [
  {
    slug: 'ai-foundations',
    title: 'AI Foundations',
    promise: 'Understand AI in an afternoon.',
    forWho: 'For the curious and the busy.',
    level: 'Beginner',
    lessons: academy.shortcourse,
  },
  {
    slug: 'ai-careers-bootcamp',
    title: 'AI and Tech Careers Bootcamp',
    promise: 'Start at zero. Finish job ready.',
    forWho: 'For anyone who wants the career, not just the idea.',
    level: 'Beginner',
    lessons: academy.bootcamp,
  },
  {
    slug: 'engineering-mentorship',
    title: 'Engineering Mentorship Program',
    promise: 'From graduate to industry-ready engineer in 12 weeks.',
    forWho: 'For CS graduates ready to build a real, DevSecOps-first portfolio.',
    level: 'Beginner',
    lessons: academy.mentorship,
  },
];

/**
 * A lesson URL, derived from its number and the first few words of its title.
 * The number prefix keeps it unique inside a course even when two modules open
 * the same way, as parts one and two of the ladder do.
 */
export function lessonSlug(lesson: AcademyModule): string {
  const words = lesson.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 6);
  return `${lesson.number}-${words.join('-')}`;
}

/** Everything a reader actually reads on a lesson page, as plain words. */
function lessonWordCount(lesson: AcademyModule): number {
  const text = [
    lesson.hookHtml,
    lesson.bodyHtml,
    lesson.activityHtml,
    ...lesson.outcomes,
    ...lesson.keyTerms.map((k) => `${k.term} ${k.planHtml}`),
  ].join(' ');
  const words = text
    .replace(/<[^>]+>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words.length;
}

/** Honest reading time at a relaxed 180 words a minute, rounded up to a minute. */
export function readingMinutes(lesson: AcademyModule): number {
  return Math.max(1, Math.round(lessonWordCount(lesson) / 180));
}

export function courseMinutes(course: Course): number {
  return course.lessons.reduce((total, lesson) => total + readingMinutes(lesson), 0);
}

export function getCourse(slug: string): Course | undefined {
  return COURSES.find((c) => c.slug === slug);
}

export function getLesson(course: Course, slug: string): AcademyModule | undefined {
  return course.lessons.find((lesson) => lessonSlug(lesson) === slug);
}

export function lessonHref(course: Course, lesson: AcademyModule): string {
  return `/training/${course.slug}/${lessonSlug(lesson)}`;
}

/** The lesson before and after this one, for the only two buttons on the page. */
export function lessonNeighbours(course: Course, lesson: AcademyModule) {
  const i = course.lessons.findIndex((l) => l.number === lesson.number);
  return {
    index: i,
    previous: i > 0 ? course.lessons[i - 1] : null,
    next: i >= 0 && i < course.lessons.length - 1 ? course.lessons[i + 1] : null,
  };
}

/**
 * The reference pages that are not courses. They used to be sections buried at
 * the bottom of the one big page, where nobody scrolled far enough to find
 * them. Counts are derived so a guide never advertises a number it does not have.
 */
export interface Guide {
  slug: string;
  title: string;
  blurb: string;
  count: string;
}

export const GUIDES: Guide[] = [
  {
    slug: 'career-tracks',
    title: 'Career tracks',
    blurb: 'The directions you can take, and how the roles actually differ.',
    count: `${academy.tracks.reduce((n, t) => n + t.roles.length, 0)} roles`,
  },
  {
    slug: 'salaries',
    title: 'Salary guide',
    blurb: 'What these roles pay in rands, from intern to lead.',
    count: `${academy.salaries.length} roles`,
  },
  {
    slug: 'certifications',
    title: 'Certifications',
    blurb: 'Proof you can do the work. Mostly free, all links official.',
    count: `${academy.certs.reduce((n, g) => n + g.items.length, 0)} certificates`,
  },
  {
    slug: 'case-studies',
    title: 'Case studies',
    blurb: 'How South African companies turn this work into money.',
    count: `${academy.usecases.length} companies`,
  },
  {
    slug: 'resources',
    title: 'Free resources',
    blurb: 'Hand picked videos, guides and docs to go deeper.',
    count: `${academy.links.length} links`,
  },
];
