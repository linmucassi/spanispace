'use client';

import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function CompanyError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundary
      {...props}
      homeHref="/company/dashboard"
      homeLabel="Back to Dashboard"
    />
  );
}
