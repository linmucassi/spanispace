'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Dust with a school/flock behaviour: separation + alignment + cohesion
// (Craig Reynolds' boids model), computed on the CPU each frame because each
// particle needs to know where its neighbours are and which way they're
// heading — a per-vertex GPU shader can't see other vertices, so this part
// can't live in the shader the way the earlier noise-warp did.
const PARTICLE_COUNT = 260;

// How close a particle gets to the camera before it's recycled to the back —
// this is what makes it read as "travelling through space" rather than a
// static field: particles drift toward the viewer, then loop.
const NEAR_RECYCLE_Z  = 22;
const FAR_RESPAWN_Z   = -55;

// ── Boid tuning ──────────────────────────────────────────────────────────
const PERCEPTION_RADIUS    = 16;   // "notice a neighbour" range for align + cohesion
const PERCEPTION_RADIUS_SQ = PERCEPTION_RADIUS * PERCEPTION_RADIUS;
const SEPARATION_RADIUS    = 6;    // "too close, back off" range
const SEPARATION_RADIUS_SQ = SEPARATION_RADIUS * SEPARATION_RADIUS;
const MAX_SPEED   = 0.15;
const MAX_FORCE   = 0.012;         // per-frame steering clamp — keeps turns smooth, not instant
const W_SEPARATION = 1.7;
const W_ALIGNMENT  = 1.0;
const W_COHESION   = 0.9;
const W_BOUNDARY   = 4.0;
const FORWARD_ACCEL = 0.0009;      // gentle constant pull toward the camera, so the school still travels
const BOUNDARY_MARGIN_FRAC = 0.82; // start steering inward at 82% of the visible frustum

// A "startle" every few seconds gives one particle a hard kick; alignment
// propagates that new heading to its neighbours over the following frames,
// which is what reads as a school suddenly turning together rather than
// each particle just wandering on its own.
const STARTLE_MIN_INTERVAL = 3.5;
const STARTLE_MAX_INTERVAL = 8;
const STARTLE_COUNT = 3;
const STARTLE_STRENGTH = MAX_SPEED * 2.2;

// RGB triples matching brand palette
const PALETTE: [number, number, number][] = [
  [0.388, 0.400, 0.945], // indigo-500
  [0.545, 0.361, 0.965], // violet-500
  [0.024, 0.714, 0.831], // cyan-500
  [0.231, 0.510, 0.965], // blue-500
];

const VERTEX_SHADER = `
uniform float uSize;
uniform float uPixelRatio;

attribute vec3 color;
varying vec3 vColor;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = uSize * uPixelRatio * (150.0 / -mvPosition.z);
  vColor = color;
}
`;

const FRAGMENT_SHADER = `
varying vec3 vColor;

void main() {
  // Soft circular falloff from the point's centre — a glowing dust mote
  // instead of the default hard square.
  float d = distance(gl_PointCoord, vec2(0.5));
  float strength = 1.0 - smoothstep(0.0, 0.5, d);
  gl_FragColor = vec4(vColor, strength * 0.8);
}
`;

export default function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Scene ──────────────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 200);
    camera.position.z = 35;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pixelRatio);
    el.appendChild(renderer.domElement);

    // The frustum is narrower close to the camera and wider far away. Seeding
    // (and later re-clamping) each particle's X/Y against the frustum width
    // *at its own depth* is what keeps the field edge-to-edge everywhere,
    // instead of a fixed box, which clips near particles at the sides while
    // far ones sit safely inside.
    const vFovRad = (camera.fov * Math.PI) / 180;
    function frustumHalfExtentsAtZ(z: number) {
      const dist = Math.max(camera.position.z - z, 1);
      const halfHeight = dist * Math.tan(vFovRad / 2);
      return { halfWidth: halfHeight * camera.aspect, halfHeight };
    }

    // ── Particles ──────────────────────────────────────────────────────────
    const positions  = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const colors     = new Float32Array(PARTICLE_COUNT * 3);

    function spawnParticle(i: number, z: number) {
      const { halfWidth, halfHeight } = frustumHalfExtentsAtZ(z);
      positions[i * 3]     = (Math.random() * 2 - 1) * halfWidth * 0.85;
      positions[i * 3 + 1] = (Math.random() * 2 - 1) * halfHeight * 0.85;
      positions[i * 3 + 2] = z;
      velocities[i * 3]     = (Math.random() - 0.5) * 0.03;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.03;
      velocities[i * 3 + 2] = 0.03 + Math.random() * 0.03;
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      spawnParticle(i, FAR_RESPAWN_Z + Math.random() * (NEAR_RECYCLE_Z - FAR_RESPAWN_Z));

      const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      colors[i * 3]     = c[0];
      colors[i * 3 + 1] = c[1];
      colors[i * 3 + 2] = c[2];
    }

    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointsGeo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

    const uniforms = {
      uSize:       { value: 1.6 },
      uPixelRatio: { value: pixelRatio },
    };

    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      // Additive blending is what makes overlapping dust motes glow instead
      // of stacking as flat translucent squares; depthWrite off avoids
      // sorting artefacts between them.
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Points(pointsGeo, shaderMaterial));

    // ── Mouse steering ──────────────────────────────────────────────────────
    // Two effects blended, both damped so it reads as smoothly "steering"
    // rather than snapping: the whole field tilts (depth/parallax between
    // particle layers), and the camera itself drifts a little with the
    // cursor while still looking at the centre, like looking around as you
    // travel rather than the scene just spinning on the spot.
    let mouseX = 0, mouseY = 0;
    let rotX   = 0, rotY   = 0;
    let camX   = 0, camY   = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width  - 0.5;
      mouseY = (e.clientY - rect.top)  / rect.height - 0.5;
    };
    window.addEventListener('mousemove', onMouseMove);

    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Animation loop ──────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let raf: number;
    let nextStartleAt = STARTLE_MIN_INTERVAL + Math.random() * (STARTLE_MAX_INTERVAL - STARTLE_MIN_INTERVAL);

    function animate() {
      raf = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();
      if (elapsed > nextStartleAt) {
        for (let k = 0; k < STARTLE_COUNT; k++) {
          const i = Math.floor(Math.random() * PARTICLE_COUNT) * 3;
          const dirX = Math.random() - 0.5;
          const dirY = Math.random() - 0.5;
          const dirZ = (Math.random() - 0.5) * 0.4;
          const len = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1;
          velocities[i]     += (dirX / len) * STARTLE_STRENGTH;
          velocities[i + 1] += (dirY / len) * STARTLE_STRENGTH;
          velocities[i + 2] += (dirZ / len) * STARTLE_STRENGTH;
        }
        nextStartleAt = elapsed + STARTLE_MIN_INTERVAL + Math.random() * (STARTLE_MAX_INTERVAL - STARTLE_MIN_INTERVAL);
      }

      // Naive O(n^2) neighbour scan — at this particle count (260, ~67k
      // pairs) it's a fraction of a millisecond, well inside frame budget,
      // so no spatial partitioning needed.
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ix = i * 3, iy = ix + 1, iz = ix + 2;
        const pix = positions[ix], piy = positions[iy], piz = positions[iz];

        let sepX = 0, sepY = 0, sepZ = 0;
        let avgVelX = 0, avgVelY = 0, avgVelZ = 0;
        let avgPosX = 0, avgPosY = 0, avgPosZ = 0;
        let neighborCount = 0;

        for (let j = 0; j < PARTICLE_COUNT; j++) {
          if (j === i) continue;
          const jx = j * 3, jy = jx + 1, jz = jx + 2;
          const dx = pix - positions[jx];
          const dy = piy - positions[jy];
          const dz = piz - positions[jz];
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq > PERCEPTION_RADIUS_SQ || distSq < 0.0001) continue;

          avgVelX += velocities[jx]; avgVelY += velocities[jy]; avgVelZ += velocities[jz];
          avgPosX += positions[jx];  avgPosY += positions[jy];  avgPosZ += positions[jz];
          neighborCount++;

          if (distSq < SEPARATION_RADIUS_SQ) {
            // Inverse-square push: strong right up close, negligible near
            // the edge of the separation radius.
            sepX += dx / distSq; sepY += dy / distSq; sepZ += dz / distSq;
          }
        }

        let ax = 0, ay = 0, az = 0;

        if (neighborCount > 0) {
          // Alignment — steer toward the neighbourhood's average heading.
          const alignX = avgVelX / neighborCount - velocities[ix];
          const alignY = avgVelY / neighborCount - velocities[iy];
          const alignZ = avgVelZ / neighborCount - velocities[iz];
          ax += alignX * W_ALIGNMENT; ay += alignY * W_ALIGNMENT; az += alignZ * W_ALIGNMENT;

          // Cohesion — steer toward the neighbourhood's average position.
          const cohX = avgPosX / neighborCount - pix;
          const cohY = avgPosY / neighborCount - piy;
          const cohZ = avgPosZ / neighborCount - piz;
          ax += cohX * 0.02 * W_COHESION; ay += cohY * 0.02 * W_COHESION; az += cohZ * 0.02 * W_COHESION;
        }

        // Separation
        ax += sepX * W_SEPARATION; ay += sepY * W_SEPARATION; az += sepZ * W_SEPARATION;

        // Steer back in before particles reach the edge of what's visible at
        // their depth, so the school curves away from the boundary instead
        // of popping/bouncing off it.
        const { halfWidth, halfHeight } = frustumHalfExtentsAtZ(piz);
        const marginX = halfWidth * BOUNDARY_MARGIN_FRAC;
        const marginY = halfHeight * BOUNDARY_MARGIN_FRAC;
        if (pix > marginX) ax -= W_BOUNDARY * (pix - marginX) * 0.01;
        else if (pix < -marginX) ax -= W_BOUNDARY * (pix + marginX) * 0.01;
        if (piy > marginY) ay -= W_BOUNDARY * (piy - marginY) * 0.01;
        else if (piy < -marginY) ay -= W_BOUNDARY * (piy + marginY) * 0.01;

        // Gentle constant pull toward the camera so the school keeps
        // travelling overall, rather than just milling in place.
        az += FORWARD_ACCEL;

        // Clamp the steering force, then apply and clamp resulting speed —
        // both clamps are what keep turns smooth instead of snapping.
        const forceMag = Math.sqrt(ax * ax + ay * ay + az * az);
        if (forceMag > MAX_FORCE) {
          const s = MAX_FORCE / forceMag;
          ax *= s; ay *= s; az *= s;
        }

        let vx = velocities[ix] + ax;
        let vy = velocities[iy] + ay;
        let vz = velocities[iz] + az;
        const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
        if (speed > MAX_SPEED) {
          const s = MAX_SPEED / speed;
          vx *= s; vy *= s; vz *= s;
        }
        velocities[ix] = vx; velocities[iy] = vy; velocities[iz] = vz;

        positions[ix] += vx; positions[iy] += vy; positions[iz] += vz;

        if (positions[iz] > NEAR_RECYCLE_Z) {
          spawnParticle(i, FAR_RESPAWN_Z);
        }
      }
      pointsGeo.attributes.position.needsUpdate = true;

      // smooth scene tilt + camera drift following the mouse
      rotX += (mouseX * 0.28  - rotX) * 0.05;
      rotY += (-mouseY * 0.28 - rotY) * 0.05;
      scene.rotation.y = rotX;
      scene.rotation.x = rotY;

      camX += (mouseX * 6 - camX) * 0.035;
      camY += (-mouseY * 4 - camY) * 0.035;
      camera.position.x = camX;
      camera.position.y = camY;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }

    if (reduceMotion) {
      // One still frame: no boid simulation, no travel, no mouse response.
      renderer.render(scene, camera);
    } else {
      animate();
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      pointsGeo.dispose();
      shaderMaterial.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" aria-hidden="true" />;
}
