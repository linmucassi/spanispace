/** Theme storage key and the pre-paint script (see components/ThemeToggle.tsx). */
export const THEME_KEY = 'spanispace-theme';

/** Runs in <head> before first paint: saved choice, else the device setting. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;
