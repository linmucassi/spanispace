import type { MetadataRoute } from 'next';
import { JOBS } from '@/data/constants';
import { COURSES, GUIDES, lessonSlug } from '@/data/courses';

const BASE_URL = 'https://spanispace.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/jobs`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/training`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/university`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/events`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/success-stories`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/post-job`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${BASE_URL}/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
  ];

  const jobRoutes: MetadataRoute.Sitemap = JOBS.map((job) => ({
    url: `${BASE_URL}/jobs/${job.id}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Every course and every lesson is its own page now, so every one of them is
  // its own entry. Derived from data/courses.ts, so a new lesson lists itself.
  const courseRoutes: MetadataRoute.Sitemap = COURSES.flatMap((course) => [
    {
      url: `${BASE_URL}/training/${course.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    ...course.lessons.map((lesson) => ({
      url: `${BASE_URL}/training/${course.slug}/${lessonSlug(lesson)}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]);

  const guideRoutes: MetadataRoute.Sitemap = GUIDES.map((guide) => ({
    url: `${BASE_URL}/training/${guide.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...courseRoutes, ...guideRoutes, ...jobRoutes];
}
