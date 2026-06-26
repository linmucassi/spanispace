'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const PARTICLE_COUNT = 150;
const MAX_LINES      = 500;
const MAX_DIST       = 14;

// RGB triples matching brand palette
const PALETTE: [number, number, number][] = [
  [0.388, 0.400, 0.945], // indigo-500
  [0.545, 0.361, 0.965], // violet-500
  [0.024, 0.714, 0.831], // cyan-500
  [0.231, 0.510, 0.965], // blue-500
];

export default function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // ── Scene ──────────────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 200);
    camera.position.z = 35;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    // ── Particles ──────────────────────────────────────────────────────────
    const positions  = new Float32Array(PARTICLE_COUNT * 3);
    const colors     = new Float32Array(PARTICLE_COUNT * 3);
    const velocities: [number, number, number][] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 70;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;

      velocities.push([
        (Math.random() - 0.5) * 0.025,
        (Math.random() - 0.5) * 0.020,
        (Math.random() - 0.5) * 0.010,
      ]);

      const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      colors[i * 3]     = c[0];
      colors[i * 3 + 1] = c[1];
      colors[i * 3 + 2] = c[2];
    }

    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointsGeo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

    scene.add(new THREE.Points(pointsGeo, new THREE.PointsMaterial({
      size: 0.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    })));

    // ── Connection lines ────────────────────────────────────────────────────
    const linePos = new Float32Array(MAX_LINES * 6);
    const lineCol = new Float32Array(MAX_LINES * 6);

    const linesGeo = new THREE.BufferGeometry();
    linesGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    linesGeo.setAttribute('color',    new THREE.BufferAttribute(lineCol, 3));
    linesGeo.setDrawRange(0, 0);

    scene.add(new THREE.LineSegments(linesGeo, new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
    })));

    // ── Mouse parallax ─────────────────────────────────────────────────────
    let mouseX = 0, mouseY = 0;
    let rotX   = 0, rotY   = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX =  (e.clientX / window.innerWidth  - 0.5);
      mouseY =  (e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('mousemove', onMouseMove);

    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Animation loop ──────────────────────────────────────────────────────
    let raf: number;

    function animate() {
      raf = requestAnimationFrame(animate);

      // drift particles
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        positions[i * 3]     += velocities[i][0];
        positions[i * 3 + 1] += velocities[i][1];
        positions[i * 3 + 2] += velocities[i][2];
        if (Math.abs(positions[i * 3])     > 35) velocities[i][0] *= -1;
        if (Math.abs(positions[i * 3 + 1]) > 25) velocities[i][1] *= -1;
        if (Math.abs(positions[i * 3 + 2]) > 20) velocities[i][2] *= -1;
      }
      pointsGeo.attributes.position.needsUpdate = true;

      // rebuild connection lines each frame
      let li = 0;
      for (let i = 0; i < PARTICLE_COUNT && li < MAX_LINES; i++) {
        for (let j = i + 1; j < PARTICLE_COUNT && li < MAX_LINES; j++) {
          const dx = positions[i*3]   - positions[j*3];
          const dy = positions[i*3+1] - positions[j*3+1];
          const dz = positions[i*3+2] - positions[j*3+2];
          const d  = Math.sqrt(dx*dx + dy*dy + dz*dz);
          if (d < MAX_DIST) {
            const alpha = (1 - d / MAX_DIST) * 0.55;
            const b = li * 6;
            linePos[b]   = positions[i*3];   linePos[b+1] = positions[i*3+1]; linePos[b+2] = positions[i*3+2];
            linePos[b+3] = positions[j*3];   linePos[b+4] = positions[j*3+1]; linePos[b+5] = positions[j*3+2];
            // soft indigo/blue glow
            lineCol[b]   = alpha * 0.35; lineCol[b+1] = alpha * 0.35; lineCol[b+2] = alpha;
            lineCol[b+3] = alpha * 0.35; lineCol[b+4] = alpha * 0.35; lineCol[b+5] = alpha;
            li++;
          }
        }
      }
      linesGeo.setDrawRange(0, li * 2);
      linesGeo.attributes.position.needsUpdate = true;
      linesGeo.attributes.color.needsUpdate    = true;

      // smooth scene tilt following mouse
      rotX += (mouseX * 0.28  - rotX) * 0.04;
      rotY += (-mouseY * 0.28 - rotY) * 0.04;
      scene.rotation.y = rotX;
      scene.rotation.x = rotY;

      renderer.render(scene, camera);
    }

    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      pointsGeo.dispose();
      linesGeo.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" aria-hidden="true" />;
}
