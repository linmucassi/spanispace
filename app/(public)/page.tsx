
import Hero from '@/components/Hero';
import JobBoard from '@/components/JobBoard';
import TrainingSection from '@/components/TrainingSection';
import AcademicPortal from '@/components/AcademicPortal';
import SuccessStories from '@/components/SuccessStories';

export default function Home() {
  return (
    <>
    <div id='home'>
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
