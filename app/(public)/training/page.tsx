import type { Metadata } from 'next';
import TrainingSection from '@/components/TrainingSection';

export const metadata: Metadata = {
  title: 'Bootcamps & Training Programs',
  description:
    'Practical, expert-led bootcamps and short courses to make South African graduates job-ready in weeks, not years. Beginner courses are free, advanced courses are paid.',
  alternates: { canonical: '/training' },
};

export default function TrainingPage() {
  return (
    <div className="pt-20">
      <TrainingSection />
    </div>
  );
}
