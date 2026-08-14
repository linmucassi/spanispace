'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { loadGoogleIdentityScript, generateNonce } from './googleIdentity';

interface UseGoogleSignInOptions {
  onSignedIn: (userId: string) => Promise<void> | void;
  onError: (message: string) => void;
}

// Mounts Google's own "Continue with Google" button into buttonRef and
// exchanges the ID token it returns for a Supabase session via
// signInWithIdToken -- no redirect to Supabase's hosted OAuth endpoint, so
// the whole flow (and the consent screen Google shows) stays on this origin.
export function useGoogleSignIn({ onSignedIn, onError }: UseGoogleSignInOptions) {
  // A callback ref, not useRef: the register page conditionally unmounts
  // this container when switching tabs, and a plain ref wouldn't tell the
  // effect below to re-render the button into the new DOM node on remount.
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const buttonRef = useCallback((node: HTMLDivElement | null) => setContainer(node), []);
  const [loading, setLoading] = useState(false);

  // Refs keep the effect calling whatever the latest callbacks are without
  // needing to reinitialize the Google button every time the parent
  // component re-renders for an unrelated reason (e.g. typing in a field).
  const onSignedInRef = useRef(onSignedIn);
  const onErrorRef = useRef(onError);
  onSignedInRef.current = onSignedIn;
  onErrorRef.current = onError;

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !container) return;

    let cancelled = false;

    (async () => {
      try {
        await loadGoogleIdentityScript();
      } catch {
        if (!cancelled) onErrorRef.current('Could not load Google sign-in. Please try again.');
        return;
      }
      if (cancelled || !window.google) return;

      const { nonce, hashedNonce } = await generateNonce();
      if (cancelled) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
        callback: async (response) => {
          setLoading(true);
          const supabase = createClient();
          if (!supabase) {
            onErrorRef.current('Authentication service is not configured.');
            setLoading(false);
            return;
          }

          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: response.credential,
            nonce,
          });

          if (error || !data.user) {
            onErrorRef.current(error?.message ?? 'Google sign-in failed.');
            setLoading(false);
            return;
          }

          try {
            await onSignedInRef.current(data.user.id);
          } finally {
            setLoading(false);
          }
        },
      });

      window.google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'continue_with',
        width: Math.min(container.offsetWidth || 320, 400),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [container]);

  return { buttonRef, loading };
}
