'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Dust, not a network — no connecting lines, no hard square points.
const PARTICLE_COUNT = 400;

// How close a particle gets to the camera before it's recycled to the back —
// this is what makes it read as "travelling through space" rather than a
// static field: particles drift toward the viewer, then loop.
const NEAR_RECYCLE_Z  = 22;
const FAR_RESPAWN_Z   = -55;

// RGB triples matching brand palette
const PALETTE: [number, number, number][] = [
  [0.388, 0.400, 0.945], // indigo-500
  [0.545, 0.361, 0.965], // violet-500
  [0.024, 0.714, 0.831], // cyan-500
  [0.231, 0.510, 0.965], // blue-500
];

// Classic Ashima Arts / Ian McEwan simplex noise (MIT), the same building
// block used for the noise-driven "flow field" motion described in
// https://blog.maximeheckel.com/posts/the-magical-world-of-particles-with-react-three-fiber-and-shaders/ —
// this is what makes particles warp and drift on their own instead of
// moving along a fixed path. Runs entirely on the GPU per-vertex, every
// frame, driven by uTime.
const NOISE_GLSL = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

const VERTEX_SHADER = `
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uWarpStrength;

attribute vec3 color;
varying vec3 vColor;

${NOISE_GLSL}

void main() {
  vec3 pos = position;

  // Three offset noise samples (one per axis) so the warp isn't just a
  // single scalar pushing every particle the same way — each axis drifts on
  // its own slow, organic path, like dust caught in an invisible current.
  float nx = snoise(pos * 0.035 + vec3(0.0,   0.0,  uTime * 0.06));
  float ny = snoise(pos * 0.035 + vec3(37.2, 17.1,  uTime * 0.06));
  float nz = snoise(pos * 0.035 + vec3(-11.4, 5.6,  uTime * 0.06));
  pos += vec3(nx, ny, nz) * uWarpStrength;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = uSize * uPixelRatio * (150.0 / -mvPosition.z);

  vColor = color;
}
`;

const FRAGMENT_SHADER = `
varying vec3 vColor;

void main() {
  // Soft circular falloff from the point's centre — a glowing dust mote
  // instead of PointsMaterial's default hard square.
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
    // These CPU-side positions are the particles' "anchor" points — travel
    // (drift toward camera, recycle, edge bounce) still happens here, in JS,
    // once a frame. The GPU-side noise warp in the vertex shader then
    // displaces each anchor a little every frame for the organic self-motion,
    // without needing per-particle JS work for that part.
    const positions  = new Float32Array(PARTICLE_COUNT * 3);
    const colors     = new Float32Array(PARTICLE_COUNT * 3);
    const driftXY: [number, number][] = [];
    const driftZ: number[] = [];

    function spawnParticle(i: number, z: number) {
      const { halfWidth, halfHeight } = frustumHalfExtentsAtZ(z);
      // 0.92 margin so particles drift a touch past the edge before
      // bouncing, instead of visibly reversing right at the boundary.
      positions[i * 3]     = (Math.random() * 2 - 1) * halfWidth * 0.92;
      positions[i * 3 + 1] = (Math.random() * 2 - 1) * halfHeight * 0.92;
      positions[i * 3 + 2] = z;
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      spawnParticle(i, FAR_RESPAWN_Z + Math.random() * (NEAR_RECYCLE_Z - FAR_RESPAWN_Z));

      driftXY.push([(Math.random() - 0.5) * 0.016, (Math.random() - 0.5) * 0.013]);
      driftZ.push(0.012 + Math.random() * 0.026);

      const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      colors[i * 3]     = c[0];
      colors[i * 3 + 1] = c[1];
      colors[i * 3 + 2] = c[2];
    }

    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointsGeo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

    const uniforms = {
      uTime:         { value: 0 },
      uSize:         { value: 1.6 },
      uPixelRatio:   { value: pixelRatio },
      uWarpStrength: { value: 3.5 },
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

    function animate() {
      raf = requestAnimationFrame(animate);

      uniforms.uTime.value = clock.getElapsedTime();

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const zi = i * 3 + 2;
        positions[i * 3]     += driftXY[i][0];
        positions[i * 3 + 1] += driftXY[i][1];
        positions[zi]        += driftZ[i];

        if (positions[zi] > NEAR_RECYCLE_Z) {
          spawnParticle(i, FAR_RESPAWN_Z);
          continue;
        }

        const { halfWidth, halfHeight } = frustumHalfExtentsAtZ(positions[zi]);
        if (Math.abs(positions[i * 3]) > halfWidth)  driftXY[i][0] *= -1;
        if (Math.abs(positions[i * 3 + 1]) > halfHeight) driftXY[i][1] *= -1;
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
      // One still frame: no drift, no travel, no warp, no mouse response.
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
