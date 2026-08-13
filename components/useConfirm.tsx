'use client';

// A promise-based confirmation dialog, for anywhere in the app that deletes
// something with no undo -- candidate documents/work experience/education,
// and the admin delete buttons (jobs/trainings/events/learnerships/late uni
// apps), which used to fire on a plain browser confirm().
//
// Usage:
//   const { confirm, ConfirmDialog } = useConfirm();
//   async function handleDelete(id: string) {
//     if (!(await confirm('Delete this document? This cannot be undone.'))) return;
//     ...actually delete...
//   }
//   return <div>...{ConfirmDialog}</div>;

import { useCallback, useRef, useState } from 'react';

export function useConfirm() {
  const [message, setMessage] = useState<string | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((msg: string) => {
    setMessage(msg);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function respond(result: boolean) {
    setMessage(null);
    resolver.current?.(result);
    resolver.current = null;
  }

  const ConfirmDialog =
    message !== null ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
          <p className="text-sm text-slate-800">{message}</p>
          <p className="text-xs text-slate-400 mt-2">This cannot be undone.</p>
          <div className="flex gap-2 justify-end mt-5">
            <button
              type="button"
              onClick={() => respond(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => respond(true)}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return { confirm, ConfirmDialog };
}
