'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#f8fafc',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '28rem',
            background: '#fff',
            borderRadius: '1rem',
            border: '1px solid #e2e8f0',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h2 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>
            Something went wrong
          </h2>
          <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.875rem' }}>
            A critical error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              background: '#4f46e5',
              color: '#fff',
              padding: '0.625rem 1.25rem',
              borderRadius: '0.75rem',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
