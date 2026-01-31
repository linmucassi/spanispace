
import Hero from '../components/Hero';
import JobBoard from '../components/JobBoard';
import TrainingSection from '../components/TrainingSection';
import AcademicPortal from '../components/AcademicPortal';
import SuccessStories from '../components/SuccessStories';

export default function Home() {
  return (
    <>
      <Hero />
      <div id="jobs">
        <JobBoard />
      </div>
      <TrainingSection />
      <AcademicPortal />
      <SuccessStories />
    </>
  );
}
