'use client';

/**
 * Light / dark theme switch (Linda, 21 Oct 2026).
 *
 * The theme is a `dark` class on <html>. THEME_SCRIPT runs in <head> before
 * the first paint, so there's no flash of the wrong theme. With no saved
 * choice it follows the device setting, and keeps following it live.
 *
 * - variant "icon": a round sun/moon button, for the public navbar and the
 *   portal top bars.
 * - variant "segmented": a Light | Dark switch, for the portal sidebar.
 */

import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

import { THEME_KEY } from '@/lib/theme';

type Theme = 'light' | 'dark';

function currentTheme(): Theme {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function subscribe(onChange: () => void) {
  // Other toggles on the page (navbar + sidebar) stay in step.
  window.addEventListener('spanispace-theme', onChange);
  // No saved choice: follow the device as it changes.
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onMedia = () => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch {}
    if (!saved) {
      document.documentElement.classList.toggle('dark', media.matches);
      onChange();
    }
  };
  media.addEventListener('change', onMedia);
  return () => {
    window.removeEventListener('spanispace-theme', onChange);
    media.removeEventListener('change', onMedia);
  };
}

function useTheme(): [Theme, (t: Theme) => void] {
  // The server render assumes light; the real value is read on the client.
  const theme = useSyncExternalStore(subscribe, currentTheme, () => 'light' as Theme);

  const setTheme = (t: Theme) => {
    document.documentElement.classList.toggle('dark', t === 'dark');
    try { localStorage.setItem(THEME_KEY, t); } catch {}
    window.dispatchEvent(new Event('spanispace-theme'));
  };

  return [theme, setTheme];
}

export default function ThemeToggle({ variant = 'icon', className = '' }: { variant?: 'icon' | 'segmented'; className?: string }) {
  const [theme, setTheme] = useTheme();

  if (variant === 'segmented') {
    return (
      <div role="radiogroup" aria-label="Theme" className={`grid grid-cols-2 gap-1 rounded-xl bg-ink-50 p-1 ${className}`}>
        {(['light', 'dark'] as const).map((t) => {
          const Icon = t === 'light' ? Sun : Moon;
          const active = theme === t;
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(t)}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
                active ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-400 hover:text-ink-700'
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden /> {t === 'light' ? 'Light' : 'Dark'}
            </button>
          );
        })}
      </div>
    );
  }

  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-ink-100 bg-white text-ink-600 transition-colors hover:text-ink-900 ${className}`}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
    </button>
  );
}
