'use client';

/**
 * The space art behind the home hero (Linda, 21 Oct 2026: "a newer version of
 * the space art we had before"). Replaces the old Three.js particle field
 * with a plain 2D canvas, so there's no 3D library to download:
 * - three depth layers of twinkling stars that drift slowly and shift a
 *   little with the pointer (parallax),
 * - a planet rising along the bottom edge (21 Oct 2026, replacing a small
 *   striped planet with an orbit that Linda didn't like): one huge curved
 *   horizon with a glowing atmosphere and a soft sunrise on its limb,
 * - an occasional shooting star.
 *
 * Cheap by design: device pixel ratio capped at 2, star count scales with
 * area, the planet is pre-rendered once per resize, and the loop pauses when
 * the hero is off screen or the tab is hidden. With prefers-reduced-motion
 * it draws a single still frame.
 */

import { useEffect, useRef } from 'react';

type Star = { x: number; y: number; z: number; r: number; phase: number; speed: number };
type Meteor = { x: number; y: number; vx: number; vy: number; life: number };

export default function SpaceCanvas({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let stars: Star[] = [];
    let planet: HTMLCanvasElement | null = null;
    const meteors: Meteor[] = [];
    let nextMeteor = 2500;
    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let raf = 0;
    let running = false;
    let last = performance.now();
    let t = 0;

    function renderPlanet() {
      // A planet far bigger than the hero, so only a gentle, flat arc of its
      // limb shows, in the bottom padding below all the hero content.
      const R = Math.max(w * 2.2, 1600);
      const cx = w * 0.5;
      const top = h - Math.min(96, h * 0.12);
      const cy = top + R;
      // Where the "sun" breaks over the limb.
      const sunX = w * 0.5;
      const sunY = cy - Math.sqrt(Math.max(0, R * R - (sunX - cx) ** 2));

      const off = document.createElement('canvas');
      off.width = Math.ceil(w * dpr);
      off.height = Math.ceil(h * dpr);
      const p = off.getContext('2d');
      if (!p) return;
      p.scale(dpr, dpr);

      // Atmosphere haze above the horizon, widest near the sunrise.
      p.save();
      p.translate(sunX, top);
      p.scale(1, 0.32);
      const haze = p.createRadialGradient(0, 0, 0, 0, 0, w * 0.75);
      haze.addColorStop(0, 'rgba(56,189,248,0.32)');
      haze.addColorStop(0.35, 'rgba(29,136,221,0.14)');
      haze.addColorStop(1, 'rgba(29,136,221,0)');
      p.fillStyle = haze;
      p.fillRect(-w * 1.5, -w, w * 3, w * 2);
      p.restore();

      // The planet body: deep navy, lit along the top edge.
      const body = p.createRadialGradient(sunX, top, 0, sunX, top + R * 0.35, R * 0.9);
      body.addColorStop(0, '#16467e');
      body.addColorStop(0.08, '#0c2b52');
      body.addColorStop(0.3, '#061630');
      body.addColorStop(1, '#030a18');
      p.fillStyle = body;
      p.beginPath();
      p.arc(cx, cy, R, 0, Math.PI * 2);
      p.fill();

      // Limb glow: brightest at the sunrise, fading out toward both sides.
      const fade = p.createLinearGradient(0, 0, w, 0);
      fade.addColorStop(0, 'rgba(125,211,252,0)');
      fade.addColorStop(Math.max(0.01, sunX / w - 0.28), 'rgba(125,211,252,0.35)');
      fade.addColorStop(sunX / w, 'rgba(224,242,254,1)');
      fade.addColorStop(Math.min(0.99, sunX / w + 0.4), 'rgba(125,211,252,0.35)');
      fade.addColorStop(1, 'rgba(125,211,252,0.05)');
      p.strokeStyle = fade;
      p.shadowColor = 'rgba(56,189,248,0.9)';
      for (const [width, blur, alpha] of [[14, 40, 0.18], [5, 20, 0.5], [1.6, 8, 1]] as const) {
        p.globalAlpha = alpha;
        p.lineWidth = width;
        p.shadowBlur = blur;
        p.beginPath();
        p.arc(cx, cy, R, Math.PI * 1.02, Math.PI * 1.98);
        p.stroke();
      }
      p.globalAlpha = 1;
      p.shadowBlur = 0;

      // The sun itself, just breaking over the limb.
      const sun = p.createRadialGradient(sunX, sunY, 0, sunX, sunY, 140);
      sun.addColorStop(0, 'rgba(255,255,255,0.95)');
      sun.addColorStop(0.08, 'rgba(224,242,254,0.7)');
      sun.addColorStop(0.35, 'rgba(56,189,248,0.18)');
      sun.addColorStop(1, 'rgba(56,189,248,0)');
      p.fillStyle = sun;
      p.beginPath();
      p.arc(sunX, sunY, 140, 0, Math.PI * 2);
      p.fill();

      planet = off;
    }

    function resize() {
      const rect = parent!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas!.width = Math.ceil(w * dpr);
      canvas!.height = Math.ceil(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      const count = Math.min(520, Math.round((w * h) / 2600));
      stars = Array.from({ length: count }, () => {
        const z = 0.25 + Math.random() * 0.75;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          z,
          r: 0.3 + z * 1.15 * Math.random() + (Math.random() < 0.04 ? 0.9 : 0),
          phase: Math.random() * Math.PI * 2,
          speed: 0.5 + Math.random() * 1.5,
        };
      });
      renderPlanet();
    }

    function draw(dt: number) {
      t += dt;
      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, w, h);

      // Stars.
      const px = (pointer.x - 0.5) * 24;
      const py = (pointer.y - 0.5) * 16;
      for (const s of stars) {
        if (!reduceMotion) {
          s.x -= s.z * 0.008 * dt;
          if (s.x < -4) s.x = w + 4;
        }
        const tw = reduceMotion ? 0.8 : 0.55 + 0.45 * Math.sin(s.phase + (t / 1000) * s.speed);
        const x = s.x + px * s.z;
        const y = s.y + py * s.z;
        ctx!.globalAlpha = Math.min(1, tw * (0.35 + s.z * 0.65));
        ctx!.fillStyle = s.z > 0.85 ? '#dbeafe' : '#ffffff';
        ctx!.beginPath();
        ctx!.arc(x, y, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;

      // Planet, with a touch of parallax.
      if (planet) ctx!.drawImage(planet, px * 0.3, py * 0.3, w, h);

      // Shooting stars.
      if (!reduceMotion) {
        nextMeteor -= dt;
        if (nextMeteor <= 0) {
          nextMeteor = 4000 + Math.random() * 5000;
          meteors.push({ x: w * (0.3 + Math.random() * 0.7), y: Math.random() * h * 0.35, vx: -0.75, vy: 0.32, life: 1 });
        }
        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i]!;
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          m.life -= dt / 1100;
          if (m.life <= 0) {
            meteors.splice(i, 1);
            continue;
          }
          const tail = ctx!.createLinearGradient(m.x, m.y, m.x - m.vx * 160, m.y - m.vy * 160);
          tail.addColorStop(0, `rgba(255,255,255,${0.9 * m.life})`);
          tail.addColorStop(1, 'rgba(255,255,255,0)');
          ctx!.strokeStyle = tail;
          ctx!.lineWidth = 1.4;
          ctx!.beginPath();
          ctx!.moveTo(m.x, m.y);
          ctx!.lineTo(m.x - m.vx * 160, m.y - m.vy * 160);
          ctx!.stroke();
        }
      }
    }

    function loop(now: number) {
      const dt = Math.min(64, now - last);
      last = now;
      draw(dt);
      if (running) raf = requestAnimationFrame(loop);
    }

    function start() {
      if (running || reduceMotion) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    resize();
    draw(0);

    const ro = new ResizeObserver(() => {
      resize();
      draw(0);
    });
    ro.observe(parent);

    const io = new IntersectionObserver(([entry]) => (entry?.isIntersecting && !document.hidden ? start() : stop()));
    io.observe(parent);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    const onPointer = (e: PointerEvent) => {
      const rect = parent.getBoundingClientRect();
      pointer.tx = (e.clientX - rect.left) / rect.width;
      pointer.ty = (e.clientY - rect.top) / rect.height;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onPointer);
    };
  }, []);

  return <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden />;
}
