'use client';

import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function CandidateError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundary
      {...props}
      homeHref="/candidate/dashboard"
      homeLabel="Back to Dashboard"
    />
  );
}
