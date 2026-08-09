'use client';

import { useEffect, useRef } from 'react';
import { STAR_LAYERS } from './star-field';

/**
 * The space in SpaniSpace.
 *
 * Spani is work in isiZulu and Space is the galaxy, so the landing page has
 * always wanted to feel like deep space. It used to get there with a Three.js
 * particle network: a 25 MB dependency rebuilding a web of connecting lines
 * every frame, which is a real download on a South African data bundle and the
 * thing that made the page feel busy.
 *
 * This is the same feeling for none of the weight. Three layers of stars, each
 * drifting at its own speed, so the field has depth rather than sliding as one
 * sheet. Nothing is redrawn: the drift is a CSS transform the compositor
 * handles, and the parallax writes two custom properties on a wrapper.
 *
 * Movement is deliberately slow. A full drift cycle is between two and four
 * minutes, which reads as alive when you look at it and disappears while you
 * are reading over it.
 *
 * Star positions are baked in as literals rather than generated. Math.random,
 * and even a seeded Math.sin hash, can disagree between V8 on the server and
 * JavaScriptCore on an iPhone, which shows up as a hydration mismatch.
 */
export default function SpaceBackdrop() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let raf = 0;

    // Eased so a jolt of the phone glides rather than snaps.
    const tick = () => {
      x += (targetX - x) * 0.06;
      y += (targetY - y) * 0.06;
      el.style.setProperty('--px', `${x.toFixed(2)}px`);
      el.style.setProperty('--py', `${y.toFixed(2)}px`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onPointer = (e: PointerEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * -40;
      targetY = (e.clientY / window.innerHeight - 0.5) * -28;
    };

    // Tilting the phone. gamma is left to right, beta is front to back. iOS 13
    // and up will not fire this without an explicit permission prompt, which is
    // not worth throwing at someone on their first visit, so on iPhone this
    // simply stays quiet and the drift and the scroll parallax carry it.
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      targetX = Math.max(-1, Math.min(1, e.gamma / 45)) * -34;
      targetY = Math.max(-1, Math.min(1, (e.beta - 45) / 45)) * -24;
    };

    // Works on every phone with no permission needed, so the field always
    // answers to something the reader is doing.
    const onScroll = () => {
      el.style.setProperty('--sy', `${window.scrollY * 0.15}px`);
    };

    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('deviceorientation', onTilt, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('deviceorientation', onTilt);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 overflow-hidden [--px:0px] [--py:0px] [--sy:0px]"
      aria-hidden
    >
      {/* The deep field. Brand navy rather than black, so it belongs to the logo. */}
      <div className="absolute inset-0 bg-ink-950" />

      {/* Nebulae, off centre so the composition is not a bullseye. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 72% 18%, rgba(0,112,200,0.28) 0%, transparent 62%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 15% 78%, rgba(0,90,165,0.20) 0%, transparent 60%)',
        }}
      />

      {STAR_LAYERS.map((layer, i) => (
        <div
          key={i}
          className="absolute inset-[-10%] will-change-transform"
          style={{
            // Far stars barely answer the tilt, near stars move most. That
            // difference is the whole illusion of depth.
            transform: `translate3d(calc(var(--px) * ${layer.depth}), calc(var(--py) * ${layer.depth} + var(--sy) * ${layer.depth}), 0)`,
            animation: `spani-drift ${layer.seconds}s ease-in-out infinite alternate`,
          }}
        >
          <svg className="h-full w-full" preserveAspectRatio="none">
            {layer.stars.map(([x, y, r, o], j) => (
              <circle key={j} cx={`${x}%`} cy={`${y}%`} r={r} fill="#fff" opacity={o} />
            ))}
          </svg>
        </div>
      ))}

      {/* A planet edge rising from below, which is what stops it reading as
          confetti on a dark rectangle and starts it reading as orbit. */}
      <div
        className="absolute left-1/2 h-[120vw] w-[160vw] -translate-x-1/2 rounded-[50%]"
        style={{
          top: '88%',
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(0,112,200,0.38) 0%, rgba(11,26,46,0.9) 45%, #0b1a2e 70%)',
          boxShadow: '0 -1px 60px rgba(0,112,200,0.35)',
        }}
      />
    </div>
  );
}
