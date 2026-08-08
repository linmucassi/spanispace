// Serves /llms.txt — an emerging standard for AI-readable site summaries.
// See https://llmstxt.org. The file is a short markdown summary linking to
// the most important pages, so LLMs can ground answers about Spanispace
// without crawling the whole site.

const CONTENT = `# Spanispace

> Spanispace is a free South African talent bridge platform that connects graduates and job seekers with vetted jobs, expert-led bootcamps, and verified learnerships. The platform is bilingual (English + isiZulu) and free for candidates. Companies can post jobs for free and access candidate search on paid tiers.

Spanispace is built for South African youth (18–35), with a focus on Gauteng and nationwide remote opportunities. Founded by Linda and Percy. The mission is to empower 100,000+ SA youth with job-ready skills and direct employment pathways by 2030.

## Core pages

- [Home](https://spanispace.com/): Overview, featured jobs, training programs, academic deadlines, success stories.
- [Job Board](https://spanispace.com/jobs): Vetted job listings — remote, hybrid, on-site, learnerships. All listings are verified before being published.
- [Training](https://spanispace.com/training): Every course in one place. Our own self-paced AI courses, plus partner terminal training from Terminal School (vim, awk, sed, jq). Beginner courses are free, advanced courses are paid.
- [AI Foundations](https://spanispace.com/training/ai-foundations): Free 5 lesson short course. What AI is, prompting, hallucinations and privacy, real South African uses, and where to go next. One lesson per page.
- [AI and Tech Careers Bootcamp](https://spanispace.com/training/ai-careers-bootcamp): Free 12 lesson bootcamp from zero to job ready. One lesson per page.
- [Career tracks](https://spanispace.com/training/career-tracks): Five tracks and twelve roles in AI, data, software, cloud and security, with what each does and how to break in.
- [Salary guide](https://spanispace.com/training/salaries): Monthly gross ranges in rands for twelve South African tech roles, intern to lead, verified July 2026.
- [Certifications](https://spanispace.com/training/certifications): Free and low cost certifications reachable from South Africa, with official links.
- [Case studies](https://spanispace.com/training/case-studies): How South African companies turn AI, cloud and data into money.
- [Free resources](https://spanispace.com/training/resources): Hand picked free videos, guides and docs.
- [University Deadlines](https://spanispace.com/university): Late university applications, learnerships, and vocational training dates across SA institutions.
- [Events](https://spanispace.com/events): Workshops, webinars, hackathons, and career fairs.
- [Post a Job (Free)](https://spanispace.com/post-job): Any employer can post a job for free; jobs are reviewed before going live.
- [Success Stories](https://spanispace.com/success-stories): Real candidates placed via the platform.

## For candidates

- [Sign Up](https://spanispace.com/register): Free candidate accounts.
- [Sign In](https://spanispace.com/login): Existing users.
- After sign in, candidates get a dashboard with profile, applications, training enrollments, and CV upload. Profile completeness drives a visibility score.

## For employers

- [Post a Job](https://spanispace.com/post-job): Free, no account required.
- [Register as Company](https://spanispace.com/register): Free Basic tier; Pro and Enterprise unlock full candidate search and analytics.

## Languages

Spanispace ships in English (en-ZA) and isiZulu (zu). Every public page can be toggled with the language switch in the navigation.

## Legal & policy

- [Privacy Policy](https://spanispace.com/privacy): POPIA-compliant.
- [Terms of Service](https://spanispace.com/terms): South African law.

## Differentiators

- Self-contained job applications (candidates apply directly on the site rather than being redirected to external boards).
- "Spanispace Verified" badge on all vetted listings.
- Free for candidates — no subscription, no paywall.
- Bilingual (isiZulu) — most direct competitors are English-only.
- Curated learnerships and late-uni windows updated regularly.

## Sitemap

[XML sitemap](https://spanispace.com/sitemap.xml)
`;

export async function GET() {
  return new Response(CONTENT, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
