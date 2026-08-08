import Hero from '@/components/Hero';
import { VettedStatus } from '@/types';
import CVAuditBanner from '@/components/CVAuditBanner';
import JobBoard from '@/components/JobBoard';
import TrainingSection, { type CourseMeta } from '@/components/TrainingSection';
import { COURSES, courseMinutes } from '@/data/courses';
import AcademicPortal from '@/components/AcademicPortal';
import SuccessStories from '@/components/SuccessStories';
import JsonLd from '@/components/JsonLd';
import { fetchPublicJobs } from '@/lib/publicJobs';
import { fetchPublicUniApps } from '@/lib/publicAcademic';

export const revalidate = 300;

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Spanispace',
  url: 'https://spanispace.com',
  logo: 'https://spanispace.com/assets/new-logo.png',
  description:
    'Spanispace bridges South African graduates and job seekers with vetted jobs, expert-led bootcamps, and verified learnerships.',
  address: {
    '@type': 'PostalAddress',
    addressRegion: 'Gauteng',
    addressCountry: 'ZA',
  },
  sameAs: [],
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Spanispace',
  url: 'https://spanispace.com',
  inLanguage: ['en-ZA', 'zu'],
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://spanispace.com/jobs?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is Spanispace free for job seekers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Spanispace is completely free for candidates — no subscription, no paywall. You can browse vetted jobs, apply directly, enrol in training programs, and register for events without paying anything.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is a "Spanispace Verified" job?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Every job listing on Spanispace is reviewed by our admin team before going live. Verified listings have been checked for legitimacy, accurate role details, and no scam indicators. This protects South African job seekers from the fraudulent job posts common on other boards.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Spanispace support isiZulu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The entire public site, registration flow, and candidate portal are fully translated into isiZulu. You can toggle between English and isiZulu with one click from any page.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does it cost to post a job?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Posting a job on Spanispace is free. Any employer — including informal businesses without a registered company — can post a job at spanispace.com/post-job and reach thousands of South African job seekers.',
      },
    },
    {
      '@type': 'Question',
      name: 'What kinds of opportunities does Spanispace list?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Spanispace lists vetted remote, hybrid, and on-site jobs across South Africa; SETA learnerships; expert-led bootcamps and short courses (AI for devs, cloud foundations, Excel, tech sales); late university application windows at major SA institutions (UCT, Wits, UP, UJ, UNISA); and free career events.',
      },
    },
    {
      '@type': 'Question',
      name: 'Who is Spanispace for?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Spanispace is built for South African graduates, matriculants, and job seekers aged 18–35, with a focus on Gauteng and nationwide remote opportunities. The platform also serves employers (free job posting) and training partners.',
      },
    },
  ],
};

export default async function Home() {
  const [jobs, uniApps] = await Promise.all([fetchPublicJobs(), fetchPublicUniApps()]);
  // Computed server side so the lesson prose in data/academy.ts never reaches
  // the browser. Same reason as /training. See app/(public)/training/page.tsx.
  // Real counts, from the same data the board and catalogue render. The hero
  // used to hardcode 2,400+ jobs and 12K+ candidates, neither of which was true.
  const today = new Date().toISOString().split('T')[0];
  const heroStats = {
    openJobs: jobs.filter(
      (j) => j.vettedStatus === VettedStatus.VERIFIED && j.expiryDate >= today
    ).length,
    courses: COURSES.length,
  };

  const courseMeta: Record<string, CourseMeta> = Object.fromEntries(
    COURSES.map((course) => [
      course.slug,
      { lessons: course.lessons.length, minutes: courseMinutes(course) },
    ])
  );
  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={websiteSchema} />
      <JsonLd data={faqSchema} />
      <div id="home">
        <Hero stats={heroStats} />
      </div>
      <CVAuditBanner />
      <div id="jobs">
        <JobBoard initialJobs={jobs} />
      </div>
      <div id="training">
        <TrainingSection courseMeta={courseMeta} preview />
      </div>
      <div id="academic">
        <AcademicPortal updates={uniApps} />
      </div>
      <div id="success-stories">
        <SuccessStories />
      </div>
    </>
  );
}
