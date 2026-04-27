import Hero from '@/components/Hero';
import JobBoard from '@/components/JobBoard';
import TrainingSection from '@/components/TrainingSection';
import AcademicPortal from '@/components/AcademicPortal';
import SuccessStories from '@/components/SuccessStories';
import JsonLd from '@/components/JsonLd';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Spanispace',
  url: 'https://spanispace.com',
  logo: 'https://spanispace.com/assets/logo.png',
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

export default function Home() {
  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={websiteSchema} />
      <div id="home">
        <Hero />
      </div>
      <div id="jobs">
        <JobBoard />
      </div>
      <div id="training">
        <TrainingSection />
      </div>
      <div id="academic">
        <AcademicPortal />
      </div>
      <div id="success-stories">
        <SuccessStories />
      </div>
    </>
  );
}
