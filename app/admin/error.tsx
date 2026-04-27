'use client';

import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function AdminError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundary
      {...props}
      homeHref="/admin/dashboard"
      homeLabel="Back to Admin"
    />
  );
}
