// Client-side Google Identity Services (GIS): renders Google's own
// "Continue with Google" button and hands back an ID token, entirely on
// spanispace.com. This is what lets the browser's consent screen say
// "Sign in to spanispace.com" instead of the raw Supabase project domain --
// that domain comes from wherever the ID token flow runs, and GIS runs it
// on this origin instead of redirecting through Supabase's hosted
// /auth/v1/authorize endpoint the way supabase.auth.signInWithOAuth does.
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            nonce?: string;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              width?: number;
            },
          ) => void;
        };
      };
    };
  }
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
let scriptPromise: Promise<void> | null = null;

export function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('loadGoogleIdentityScript called outside the browser'));
  }
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google sign-in')));
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google sign-in'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

// A nonce ties the ID token Google issues to this specific sign-in attempt.
// Google embeds a hash of it inside the signed token; Supabase's
// signInWithIdToken re-hashes the raw value we send it and rejects the
// token if the two don't match, which is what stops a token captured
// elsewhere from being replayed against this app.
export async function generateNonce(): Promise<{ nonce: string; hashedNonce: string }> {
  const nonce = crypto.randomUUID();
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce));
  const hashedNonce = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return { nonce, hashedNonce };
}
