'use client';

import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function PublicError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBoundary {...props} homeHref="/" homeLabel="Back to Home" />;
}
