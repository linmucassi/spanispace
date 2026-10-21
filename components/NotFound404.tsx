'use client';

/**
 * The 404 page, ported from docs/modern_space_404_page.html (Linda's chosen
 * design, replacing the earlier Three.js astronaut scene).
 *
 * Changes from the HTML original:
 *   - "AuraOS" placeholder branding -> the Spanispace wordmark and real links
 *   - Font Awesome (an external CDN) -> lucide-react icons already in the app
 *   - the search box actually searches: it goes to /jobs?q=
 *   - every listener / animation frame / audio node is cleaned up on unmount
 *   - prefers-reduced-motion skips the starfield drift and the cursor satellite
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Gamepad2, Home, Play, Rocket, Search, Volume2, VolumeX, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import styles from './NotFound404.module.css';

const STAR_COUNT = 150;
const STAR_COLORS = ['#ffffff', '#a855f7', '#3b82f6', '#06b6d4'];
const HIGH_SCORE_KEY = '404_high_score';

type Star = { x: number; y: number; size: number; alpha: number; speedY: number; color: string; twinkle: number };
type Asteroid = { x: number; y: number; size: number; speed: number; rotation: number; rotSpeed: number };

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function readHighScore(): number {
  try {
    return Number(window.localStorage.getItem(HIGH_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

export default function NotFound404({ displayFont }: { displayFont: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const starCanvasRef = useRef<HTMLCanvasElement>(null);
  const satelliteRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [glitch, setGlitch] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const audioRef = useRef<{ ctx: AudioContext; osc: OscillatorNode } | null>(null);
  const [gameOpen, setGameOpen] = useState(false);

  // ---------------------------------------------------------------- starfield
  useEffect(() => {
    const canvas = starCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const still = prefersReducedMotion();
    let stars: Star[] = [];
    let frame = 0;

    const makeStar = (): Star => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.8 + 0.2,
      alpha: Math.random() * 0.7 + 0.3,
      speedY: Math.random() * 0.3 + 0.05,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      twinkle: Math.random() * 0.02 + 0.005,
    });

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = Array.from({ length: STAR_COUNT }, makeStar);
      if (still) draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 100, canvas.width / 2, canvas.height / 2, canvas.width);
      gradient.addColorStop(0, 'rgba(11, 15, 38, 0.4)');
      gradient.addColorStop(1, 'rgba(6, 8, 20, 0.8)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const star of stars) {
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const tick = () => {
      const now = Date.now();
      for (const star of stars) {
        star.y -= star.speedY;
        if (star.y < 0) {
          star.y = canvas.height;
          star.x = Math.random() * canvas.width;
        }
        star.alpha = Math.max(0.2, Math.min(0.9, star.alpha + Math.sin(now * star.twinkle) * 0.01));
      }
      draw();
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener('resize', resize);
    resize();
    if (!still) frame = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frame);
    };
  }, []);

  // -------------------------------------------------------- cursor satellite
  useEffect(() => {
    const el = satelliteRef.current;
    if (!el || prefersReducedMotion()) return;
    let targetX = -100, targetY = -100, x = -100, y = -100, frame = 0;
    const onMove = (e: MouseEvent) => { targetX = e.clientX; targetY = e.clientY; };
    const tick = () => {
      x += (targetX - x) * 0.08;
      y += (targetY - y) * 0.08;
      el.style.transform = `translate(${x + 15}px, ${y + 15}px)`;
      frame = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', onMove);
    frame = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  // ------------------------------------------------------------ ambient drone
  const toggleSound = () => {
    if (audioRef.current) {
      audioRef.current.osc.stop();
      void audioRef.current.ctx.close();
      audioRef.current = null;
      setSoundOn(false);
      return;
    }
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      audioRef.current = { ctx, osc };
      setSoundOn(true);
    } catch {
      // Blocked by the browser's autoplay policy; stay muted.
    }
  };
  useEffect(() => () => {
    audioRef.current?.osc.stop();
    void audioRef.current?.ctx.close();
  }, []);

  // ------------------------------------------------------------------ search
  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/jobs?q=${encodeURIComponent(q)}`);
  };

  const triggerGlitch = () => {
    setGlitch(true);
    window.setTimeout(() => setGlitch(false), 500);
  };

  return (
    <div className={`${styles.page} ${displayFont} relative flex min-h-screen flex-col justify-between overflow-x-hidden text-slate-100 selection:bg-[#a855f7] selection:text-white`}>
      <canvas ref={starCanvasRef} className="pointer-events-none fixed inset-0 z-0" aria-hidden />

      {/* Satellite that trails the cursor (desktop only) */}
      <div ref={satelliteRef} className="pointer-events-none fixed left-0 top-0 z-20 hidden md:block" style={{ transform: 'translate(-100px, -100px)' }} aria-hidden>
        <div className={`relative ${styles.float}`}>
          <svg className="h-12 w-12 text-[#06b6d4] drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <div className="absolute -bottom-1 -right-1 h-2 w-2 animate-ping rounded-full bg-[#a855f7]" />
        </div>
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="group flex items-center" aria-label="Spanispace home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo-wordmark.png" alt="Spanispace" className="h-8 w-auto brightness-0 invert transition-opacity group-hover:opacity-80" />
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            title={t('notFound.audio')}
            className={`${styles.glass} flex items-center gap-2 rounded-xl p-2.5 text-sm text-slate-400 transition-all hover:border-[#a855f7]/50 hover:text-white`}
          >
            {soundOn ? <Volume2 className="h-4 w-4 text-[#06b6d4]" aria-hidden /> : <VolumeX className="h-4 w-4" aria-hidden />}
            <span className="hidden text-xs font-medium sm:inline">{t('notFound.audio')}</span>
          </button>
          <button
            type="button"
            onClick={() => setGameOpen(true)}
            className={`${styles.glass} flex items-center gap-2 rounded-xl border border-[#a855f7]/30 px-4 py-2 text-xs font-semibold text-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all hover:border-[#a855f7]/80 hover:bg-[#a855f7]/10 sm:text-sm`}
          >
            <Gamepad2 className="h-4 w-4 text-[#06b6d4]" aria-hidden />
            <span>{t('notFound.playGame')}</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto my-auto flex max-w-5xl flex-col items-center px-6 py-8 text-center">
        <div className="relative my-4 select-none">
          <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-[#a855f7]/30 via-[#3b82f6]/20 to-[#06b6d4]/30 blur-3xl ${styles.pulseGlow}`} />
          <h1
            className={`relative bg-gradient-to-b from-white via-slate-200 to-slate-500/30 bg-clip-text text-8xl font-black leading-none tracking-tighter text-transparent sm:text-[13rem] md:text-[16rem] ${styles.glowText} ${styles.float}`}
            style={{ fontFamily: 'var(--font-orbitron)' }}
            aria-label="404"
          >
            4
            <button
              type="button"
              onClick={triggerGlitch}
              tabIndex={-1}
              aria-hidden
              className={`inline-block cursor-pointer bg-gradient-to-tr from-[#a855f7] via-[#3b82f6] to-[#06b6d4] bg-clip-text text-transparent transition-transform duration-500 hover:rotate-12 ${glitch ? 'animate-ping' : ''}`}
            >
              0
            </button>
            4
          </h1>
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 opacity-80 sm:h-44 sm:w-44 md:h-56 md:w-56" aria-hidden>
            <div className={`relative flex h-full w-full items-center justify-center rounded-full border border-[#06b6d4]/20 ${styles.spinSlow}`}>
              <div className="h-3/4 w-3/4 rounded-full border border-dashed border-[#a855f7]/40" />
            </div>
          </div>
        </div>

        <div className="mx-auto -mt-4 max-w-2xl space-y-4 sm:-mt-8">
          <div className={`${styles.glass} inline-flex items-center gap-2 rounded-full border border-[#06b6d4]/30 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#06b6d4] shadow-lg`}>
            <span className="h-2 w-2 animate-ping rounded-full bg-[#06b6d4]" />
            {t('notFound.eyebrow')}
          </div>
          <h2 className="text-2xl font-bold tracking-wide text-white sm:text-4xl" style={{ fontFamily: 'var(--font-orbitron)' }}>
            {t('notFound.headingStart')}{' '}
            <span className="bg-gradient-to-r from-[#a855f7] to-[#06b6d4] bg-clip-text text-transparent">{t('notFound.headingEnd')}</span>
          </h2>
          <p className="text-sm leading-relaxed text-slate-400 sm:text-base">{t('notFound.message')}</p>
        </div>

        <form onSubmit={search} className="relative mx-auto mt-8 flex w-full max-w-md items-center" role="search">
          <Search className="pointer-events-none absolute left-4 h-4 w-4 text-slate-500" aria-hidden />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('notFound.searchPlaceholder')}
            aria-label={t('notFound.searchPlaceholder')}
            className={`${styles.glass} w-full rounded-2xl px-5 py-3.5 pl-11 pr-24 text-sm text-white placeholder-slate-500 shadow-inner transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#a855f7]/60`}
          />
          <button type="submit" className={`${styles.btnNeon} absolute right-2 rounded-xl px-4 py-2 text-xs font-semibold text-white`}>
            {t('notFound.find')}
          </button>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/" className={`${styles.btnNeon} group flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-semibold text-white shadow-lg`}>
            <Home className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
            <span>{t('notFound.backHome')}</span>
          </Link>
          <button
            type="button"
            onClick={() => router.back()}
            className={`${styles.glass} flex items-center gap-2 rounded-2xl border border-slate-700/60 px-7 py-3.5 text-sm font-semibold text-slate-300 transition-all hover:border-slate-500 hover:text-white`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span>{t('notFound.goBack')}</span>
          </button>
        </div>
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-7xl px-6 py-6 text-center text-xs text-slate-500 sm:flex sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} Spanispace</p>
        <nav className="mt-4 flex items-center justify-center gap-6 sm:mt-0" aria-label="Popular pages">
          <Link href="/jobs" className="transition-colors hover:text-[#06b6d4]">Jobs</Link>
          <Link href="/services" className="transition-colors hover:text-[#06b6d4]">Services</Link>
          <Link href="/training" className="transition-colors hover:text-[#06b6d4]">Training</Link>
          <Link href="/events" className="transition-colors hover:text-[#06b6d4]">Events</Link>
        </nav>
      </footer>

      {gameOpen && <AsteroidEvader onClose={() => setGameOpen(false)} />}
    </div>
  );
}

// --------------------------------------------------------------------------
// Mini-game: Asteroid Evader. Same rules as the HTML original. Keyboard
// listeners only exist while the modal is open, and Escape closes it.
// --------------------------------------------------------------------------
function AsteroidEvader({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  // Only ever mounted client-side (after a click), so reading storage here is safe.
  const [highScore, setHighScore] = useState(readHighScore);
  const state = useRef({
    player: { x: 0, y: 0, width: 30, height: 30, speed: 6 },
    asteroids: [] as Asteroid[],
    keys: {} as Record<string, boolean>,
    score: 0,
    dragging: false,
    frame: 0,
  });

  const setup = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas?.parentElement) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    state.current.player.x = canvas.width / 2 - state.current.player.width / 2;
    state.current.player.y = canvas.height - 50;
  }, []);

  useEffect(() => {
    setup();
    closeRef.current?.focus();
    const s = state.current;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) e.preventDefault();
      s.keys[e.key] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => { s.keys[e.key] = false; };
    const onMouseUp = () => { s.dragging = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('resize', setup);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', setup);
      cancelAnimationFrame(s.frame);
    };
  }, [onClose, setup]);

  const steerTo = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    state.current.player.x = clientX - rect.left - state.current.player.width / 2;
  };

  const start = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    setup();
    const s = state.current;
    s.asteroids = [];
    s.score = 0;
    setScore(0);
    setFinalScore(null);
    setRunning(true);

    const loop = () => {
      const { player } = s;
      if (s.keys.ArrowLeft || s.keys.a || s.keys.A) player.x -= player.speed;
      if (s.keys.ArrowRight || s.keys.d || s.keys.D) player.x += player.speed;
      player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

      if (Math.random() < 0.05 + Math.min(s.score * 0.0005, 0.08)) {
        const size = Math.random() * 25 + 15;
        s.asteroids.push({
          x: Math.random() * (canvas.width - size),
          y: -size,
          size,
          speed: Math.random() * 3 + 2 + Math.min(s.score * 0.05, 5),
          rotation: 0,
          rotSpeed: (Math.random() - 0.5) * 0.05,
        });
      }

      for (let i = s.asteroids.length - 1; i >= 0; i--) {
        const a = s.asteroids[i];
        a.y += a.speed;
        a.rotation += a.rotSpeed;
        if (player.x < a.x + a.size && player.x + player.width > a.x && player.y < a.y + a.size && player.y + player.height > a.y) {
          setRunning(false);
          setFinalScore(s.score);
          if (s.score > readHighScore()) {
            try { window.localStorage.setItem(HIGH_SCORE_KEY, String(s.score)); } catch { /* storage blocked */ }
            setHighScore(s.score);
          }
          return;
        }
        if (a.y > canvas.height) {
          s.asteroids.splice(i, 1);
          s.score += 10;
          setScore(s.score);
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(-6, 12);
      ctx.lineTo(0, 18 + Math.random() * 6);
      ctx.lineTo(6, 12);
      ctx.fill();
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, -player.height / 2);
      ctx.lineTo(player.width / 2, player.height / 2);
      ctx.lineTo(-player.width / 2, player.height / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      for (const a of s.asteroids) {
        ctx.save();
        ctx.translate(a.x + a.size / 2, a.y + a.size / 2);
        ctx.rotate(a.rotation);
        ctx.strokeStyle = '#64748b';
        ctx.fillStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(-a.size / 2, -a.size / 2, a.size, a.size);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      s.frame = requestAnimationFrame(loop);
    };
    cancelAnimationFrame(s.frame);
    s.frame = requestAnimationFrame(loop);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060814]/80 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="asteroid-evader-title">
      <div className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-700/80 bg-[#0b0f26] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#060814]/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <Rocket className="h-4 w-4 text-[#06b6d4]" aria-hidden />
            <div>
              <h3 id="asteroid-evader-title" className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-orbitron)' }}>ASTEROID EVADER</h3>
              <p className="text-[10px] text-slate-400">Use Left/Right keys or drag to survive</p>
            </div>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[#131b3e] hover:text-white" aria-label="Close game">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-black sm:aspect-[4/3]">
          <canvas
            ref={canvasRef}
            className={`${styles.gameCanvas} block h-full w-full touch-none`}
            onMouseDown={(e) => { state.current.dragging = true; steerTo(e.clientX); }}
            onMouseMove={(e) => { if (state.current.dragging) steerTo(e.clientX); }}
            onTouchStart={(e) => { state.current.dragging = true; steerTo(e.touches[0].clientX); }}
            onTouchMove={(e) => { if (state.current.dragging) steerTo(e.touches[0].clientX); }}
            onTouchEnd={() => { state.current.dragging = false; }}
          />
          {!running && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#060814]/90 p-6 text-center">
              <h4 className="mb-2 text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-orbitron)' }}>
                {finalScore === null ? 'ASTEROID EVADER' : 'CRITICAL COLLISION'}
              </h4>
              <p className="mb-6 max-w-xs text-xs text-slate-400">
                {finalScore === null
                  ? 'Pilot your probe through the asteroid belt. Avoid high-velocity space debris!'
                  : 'Your vessel was damaged in the asteroid field.'}
              </p>
              {finalScore !== null && (
                <div className="mb-6">
                  <span className="block text-xs uppercase tracking-wider text-slate-400">Final score</span>
                  <span className="text-4xl font-bold text-[#06b6d4]" style={{ fontFamily: 'var(--font-orbitron)' }}>{finalScore}</span>
                </div>
              )}
              <button type="button" onClick={start} className={`${styles.btnNeon} flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-semibold text-white`}>
                <Play className="h-3.5 w-3.5" aria-hidden />
                <span>{finalScore === null ? 'Launch mission' : 'Try again'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 bg-[#060814]/80 px-6 py-3 text-xs">
          <div className="text-slate-400">Score: <span className="font-mono font-bold text-[#06b6d4]">{score}</span></div>
          <div className="hidden text-[11px] text-slate-500 sm:block">[A / D] or [← / →] to steer</div>
          <div className="text-slate-400">High score: <span className="font-mono font-bold text-[#a855f7]">{highScore}</span></div>
        </div>
      </div>
    </div>
  );
}
