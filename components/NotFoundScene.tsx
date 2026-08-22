'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const STAR_COUNT = 260;

const STAR_VERTEX_SHADER = `
uniform float uSize;
uniform float uPixelRatio;
uniform float uTime;

attribute float aPhase;
attribute float aTwinkleSpeed;
varying float vTwinkle;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = uSize * uPixelRatio * (200.0 / -mvPosition.z);
  vTwinkle = 0.4 + 0.6 * (0.5 + 0.5 * sin(uTime * aTwinkleSpeed + aPhase));
}
`;

const STAR_FRAGMENT_SHADER = `
varying float vTwinkle;

void main() {
  float d = distance(gl_PointCoord, vec2(0.5));
  float strength = 1.0 - smoothstep(0.0, 0.5, d);
  gl_FragColor = vec4(vec3(1.0), strength * vTwinkle);
}
`;

// Drawn once to a canvas instead of loading a font for THREE.TextGeometry --
// the sign only ever needs to say one thing, so a baked texture is the
// cheaper and crisper option.
function makeSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#2c1f14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 14;
  ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

  ctx.fillStyle = '#fde68a';
  ctx.font = '800 140px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('404', canvas.width / 2, canvas.height / 2 + 8);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// A soft violet/cyan nebula wash, baked to a texture and applied to a big
// unlit plane far behind everything -- cheaper than volumetric shaders and
// reads the same at this scale.
function makeNebulaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  const blobs: [number, number, number, string][] = [
    [700, 220, 340, 'rgba(167,139,250,0.55)'],
    [300, 300, 300, 'rgba(34,211,238,0.4)'],
    [520, 400, 260, 'rgba(0,112,200,0.35)'],
  ];
  for (const [x, y, r, color] of blobs) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Builds a rounded-end limb (arm/leg segment) spanning two points --
// CapsuleGeometry's long axis is Y by default, so it's aligned onto the
// from->to direction with a quaternion rather than hand-rotated per limb.
function makeLimb(from: THREE.Vector3, to: THREE.Vector3, radius: number, material: THREE.Material) {
  const dir = new THREE.Vector3().subVectors(to, from);
  const length = Math.max(dir.length(), radius * 2 + 0.01);
  const geo = new THREE.CapsuleGeometry(radius, Math.max(length - radius * 2, 0.02), 4, 8);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return mesh;
}

export default function NotFoundScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b1a2e, 0.035);

    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 100);
    const lookAtTarget = new THREE.Vector3(-0.7, 1.3, 0);
    const baseCamOffset = new THREE.Vector3(1.6, 3.3, 13.5).sub(lookAtTarget);

    // Vertical FOV is fixed regardless of aspect, so a narrow phone screen
    // crops the sides -- pull the camera back along its own line of sight
    // (not just widen the frustum) so the sign-to-planet span stays fully
    // in frame instead of clipping at the left edge.
    let baseCamX = 0;
    let baseCamY = 0;
    const applyFraming = () => {
      const aspect = el.clientWidth / el.clientHeight;
      const zoomOut = aspect < 0.75 ? Math.min(2.2, 0.75 / aspect) : 1;
      camera.position.copy(lookAtTarget).addScaledVector(baseCamOffset, zoomOut);
      camera.lookAt(lookAtTarget);
      baseCamX = camera.position.x;
      baseCamY = camera.position.y;
    };
    applyFraming();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pixelRatio);
    el.appendChild(renderer.domElement);

    // ── Lighting ─────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x3f5580, 1.3));
    // Soft "starlight" fill from roughly the camera's side -- without it,
    // anything outside the lamp's small falloff radius (the astronaut's far
    // side, the post) reads as a near-black silhouette instead of a lit
    // scene, since MeshStandardMaterial has no floor brightness of its own.
    const fillLight = new THREE.DirectionalLight(0xbcd4ff, 1.3);
    fillLight.position.set(3, 7, 12);
    scene.add(fillLight);
    const lampLight = new THREE.PointLight(0xffcc66, 16, 12, 1.6);
    lampLight.position.set(-4.4, 3.6, -1.2);
    scene.add(lampLight);
    const rimLight = new THREE.PointLight(0x7c5cff, 4, 22, 1.6);
    rimLight.position.set(6, 5, -6);
    scene.add(rimLight);

    // ── Ground ───────────────────────────────────────────────────────────
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshStandardMaterial({ color: 0x142338, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // ── Distant sky (unaffected by ground fog) ──────────────────────────
    const nebula = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 21),
      new THREE.MeshBasicMaterial({
        map: makeNebulaTexture(),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    nebula.position.set(2, 8, -19);
    scene.add(nebula);

    const planetMat = new THREE.MeshStandardMaterial({ color: 0xc98a5e, roughness: 0.9, fog: false });
    const planet = new THREE.Mesh(new THREE.SphereGeometry(1.3, 24, 24), planetMat);
    planet.position.set(7, 3.5, -10);
    scene.add(planet);
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 1, fog: false }),
    );
    moon.position.set(9.3, 1.6, -8);
    scene.add(moon);

    // Starfield, static (no boids -- this scene is meant to feel still,
    // like someone waiting) but twinkling via a per-vertex phase.
    const starPositions = new Float32Array(STAR_COUNT * 3);
    const starPhase = new Float32Array(STAR_COUNT);
    const starSpeed = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      starPositions[i * 3] = (Math.random() * 2 - 1) * 24;
      starPositions[i * 3 + 1] = 1 + Math.random() * 14;
      starPositions[i * 3 + 2] = -6 - Math.random() * 22;
      starPhase[i] = Math.random() * Math.PI * 2;
      starSpeed[i] = 0.6 + Math.random() * 1.4;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('aPhase', new THREE.BufferAttribute(starPhase, 1));
    starGeo.setAttribute('aTwinkleSpeed', new THREE.BufferAttribute(starSpeed, 1));
    const starUniforms = { uSize: { value: 2.2 }, uPixelRatio: { value: pixelRatio }, uTime: { value: 0 } };
    const starMat = new THREE.ShaderMaterial({
      uniforms: starUniforms,
      vertexShader: STAR_VERTEX_SHADER,
      fragmentShader: STAR_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      fog: false,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // ── Signpost ─────────────────────────────────────────────────────────
    const rustMat = new THREE.MeshStandardMaterial({ color: 0x7c4a26, roughness: 0.8, metalness: 0.15 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.6, 8), rustMat);
    post.position.set(-4.4, 1.8, -1.2);
    scene.add(post);

    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.22, 12), rustMat);
    hood.position.set(-4.4, 3.85, -1.2);
    scene.add(hood);

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: 0xfbbf24, emissiveIntensity: 2 }),
    );
    bulb.position.set(-4.4, 3.62, -1.2);
    scene.add(bulb);

    const signBacking = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.85, 0.09),
      new THREE.MeshStandardMaterial({ color: 0x2c1f14, roughness: 0.9 }),
    );
    signBacking.position.set(-4.4, 2.55, -1.05);
    scene.add(signBacking);

    const signFace = new THREE.Mesh(
      new THREE.PlaneGeometry(1.55, 0.7),
      new THREE.MeshBasicMaterial({ map: makeSignTexture() }),
    );
    signFace.position.set(-4.4, 2.55, -1.0);
    scene.add(signFace);

    // ── Bench ────────────────────────────────────────────────────────────
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4526, roughness: 0.85 });
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x3a2414, roughness: 0.85 });

    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.09, 0.55), woodMat);
    seat.position.set(-1.8, 0.55, 0.35);
    scene.add(seat);

    [0.80, 0.95].forEach((y) => {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.05), woodMat);
      slat.position.set(-1.8, y, 0.08);
      scene.add(slat);
    });

    [
      [-2.45, 0.15], [-1.15, 0.15], [-2.45, 0.55], [-1.15, 0.55],
    ].forEach(([x, z]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.55, 0.07), darkWoodMat);
      leg.position.set(x, 0.275, z);
      scene.add(leg);
    });

    // ── Astronaut, sitting on the bench ─────────────────────────────────
    const astronaut = new THREE.Group();
    astronaut.position.set(-1.8, 0, 0.6);
    scene.add(astronaut);

    const suitMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.55 });
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x0b1a2e,
      emissive: 0x0e3a52,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.3,
    });
    const packMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.6 });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.42, 4, 8), suitMat);
    torso.position.set(0, 1.15, -0.05);
    astronaut.add(torso);

    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.5, 0.2), packMat);
    backpack.position.set(0, 1.15, -0.28);
    astronaut.add(backpack);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 20), suitMat);
    helmet.position.set(0, 1.85, -0.05);
    astronaut.add(helmet);

    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), visorMat);
    visor.position.set(0, 1.85, 0.09);
    astronaut.add(visor);

    const glint = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xbaeaff }),
    );
    glint.position.set(-0.06, 1.92, 0.24);
    astronaut.add(glint);

    const armMat = suitMat;
    astronaut.add(makeLimb(new THREE.Vector3(-0.30, 1.55, 0.02), new THREE.Vector3(-0.33, 0.66, 0.35), 0.09, armMat));
    astronaut.add(makeLimb(new THREE.Vector3(0.30, 1.55, 0.02), new THREE.Vector3(0.30, 0.66, 0.35), 0.09, armMat));

    astronaut.add(makeLimb(new THREE.Vector3(-0.16, 0.66, 0.05), new THREE.Vector3(-0.25, 0.5, 0.45), 0.11, suitMat));
    astronaut.add(makeLimb(new THREE.Vector3(-0.25, 0.5, 0.45), new THREE.Vector3(-0.25, 0.08, 0.55), 0.10, suitMat));
    astronaut.add(makeLimb(new THREE.Vector3(0.16, 0.66, 0.05), new THREE.Vector3(0.25, 0.5, 0.45), 0.11, suitMat));
    astronaut.add(makeLimb(new THREE.Vector3(0.25, 0.5, 0.45), new THREE.Vector3(0.25, 0.08, 0.55), 0.10, suitMat));

    [-0.25, 0.25].forEach((x) => {
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.09, 0.3), packMat);
      boot.position.set(x, 0.05, 0.62);
      astronaut.add(boot);
    });

    // ── Mouse parallax, same damping approach as the homepage hero ─────
    let mouseX = 0, mouseY = 0;
    let camX = 0, camY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    };
    window.addEventListener('mousemove', onMouseMove);

    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
      applyFraming();
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let raf: number;

    function animate() {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      starUniforms.uTime.value = t;
      lampLight.intensity = 15 + Math.sin(t * 3) * 1.5;
      astronaut.position.y = 0.02 * Math.sin(t * 0.8);

      camX += (mouseX * 1.4 - camX) * 0.04;
      camY += (-mouseY * 0.8 - camY) * 0.04;
      camera.position.x = baseCamX + camX;
      camera.position.y = baseCamY + camY;
      camera.lookAt(lookAtTarget);

      renderer.render(scene, camera);
    }

    if (reduceMotion) {
      renderer.render(scene, camera);
    } else {
      animate();
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => {
            const map = (m as THREE.MeshBasicMaterial).map;
            if (map) map.dispose();
            m.dispose();
          });
        }
      });
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" aria-hidden="true" />;
}
