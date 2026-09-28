// 전 페이지 공통 3D 배경 — 천천히 도는 별먼지 은하 + 바닥의 물결 격자. (2026-09-28 리디자인)
// 성능: DPR 상한 1.5, 탭이 가려지면 렌더 정지, prefers-reduced-motion 이면 한 프레임만 그림.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const STAR_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixel;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixel * (60.0 / -mv.z);
    vColor = aColor;
    vTwinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed * 1.8) + aSeed * 40.0);
  }
`;
const STAR_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    a = pow(a, 2.2) * vTwinkle;
    gl_FragColor = vec4(vColor, a);
  }
`;

function Galaxy({ count }) {
  const ref = useRef();
  const { gl } = useThree();
  const [geo, uniforms] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const seed = new Float32Array(count);
    const col = new Float32Array(count * 3);
    const palette = [new THREE.Color("#67e8f9"), new THREE.Color("#a78bfa"), new THREE.Color("#f0abfc"), new THREE.Color("#e2e8f0")];
    for (let i = 0; i < count; i++) {
      // 나선팔 3개 + 두꺼운 원반 잡음
      const arm = i % 3;
      const r = Math.pow(Math.random(), 0.6) * 60 + 4;
      const ang = r * 0.09 + (arm / 3) * Math.PI * 2 + (Math.random() - 0.5) * 0.9;
      pos[i * 3] = Math.cos(ang) * r + (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = (Math.random() - 0.5) * (10 + 40 * Math.random() * Math.random());
      pos[i * 3 + 2] = Math.sin(ang) * r + (Math.random() - 0.5) * 6;
      size[i] = Math.random() < 0.04 ? 3.2 + Math.random() * 2 : 0.8 + Math.random() * 1.4;
      seed[i] = Math.random();
      const c = palette[Math.random() < 0.55 ? 3 : arm];
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    return [g, { uTime: { value: 0 }, uPixel: { value: gl.getPixelRatio() } }];
  }, [count, gl]);

  useFrame((_, dt) => {
    uniforms.uTime.value += dt;
    if (ref.current) ref.current.rotation.y += dt * 0.012;
  });

  return (
    <points ref={ref} geometry={geo} rotation={[0.35, 0, 0.12]} position={[0, -6, -30]}>
      <shaderMaterial
        vertexShader={STAR_VERT}
        fragmentShader={STAR_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

const GRID_VERT = /* glsl */ `
  uniform float uTime;
  varying float vFade;
  varying vec2 vUv;
  void main() {
    vec3 p = position;
    float w = sin(p.x * 0.18 + uTime * 0.5) * 0.9 + cos(p.y * 0.22 + uTime * 0.35) * 0.7;
    p.z += w;
    vUv = uv;
    vFade = smoothstep(0.0, 0.55, uv.y) * (1.0 - smoothstep(0.75, 1.0, uv.y));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const GRID_FRAG = /* glsl */ `
  varying float vFade;
  varying vec2 vUv;
  void main() {
    vec3 col = mix(vec3(0.40, 0.91, 0.98), vec3(0.65, 0.55, 0.98), vUv.x);
    gl_FragColor = vec4(col, 0.10 * vFade);
  }
`;

function WaveGrid() {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((_, dt) => { uniforms.uTime.value += dt; });
  return (
    <mesh rotation={[-Math.PI / 2.15, 0, 0]} position={[0, -9, -20]}>
      <planeGeometry args={[140, 80, 70, 40]} />
      <shaderMaterial vertexShader={GRID_VERT} fragmentShader={GRID_FRAG} uniforms={uniforms} transparent wireframe depthWrite={false} />
    </mesh>
  );
}

// 마우스 따라 카메라가 살짝 기울어지는 시차 + 스크롤에 따라 천천히 전진
function Rig() {
  const { camera } = useThree();
  const target = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  useFrame(() => {
    const scroll = typeof window !== "undefined" ? window.scrollY : 0;
    camera.position.x += (target.current.x * 2.2 - camera.position.x) * 0.03;
    camera.position.y += (-target.current.y * 1.4 + 1 - camera.position.y) * 0.03;
    camera.position.z += (18 - Math.min(scroll, 3000) * 0.002 - camera.position.z) * 0.05;
    camera.lookAt(0, -2, -30);
  });
  return null;
}

export default function CosmicBackground() {
  const [frameloop, setFrameloop] = useState("always");
  const [lite, setLite] = useState(false);

  useEffect(() => {
    const rm = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const small = window.innerWidth < 768;
    setLite(small);
    const apply = () => setFrameloop(document.hidden || rm?.matches ? "demand" : "always");
    apply();
    document.addEventListener("visibilitychange", apply);
    rm?.addEventListener?.("change", apply);
    return () => {
      document.removeEventListener("visibilitychange", apply);
      rm?.removeEventListener?.("change", apply);
    };
  }, []);

  return (
    <div className="cosmic-bg" aria-hidden="true">
      <Canvas
        frameloop={frameloop}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
        camera={{ position: [0, 1, 18], fov: 60, near: 0.1, far: 300 }}
      >
        <Galaxy count={lite ? 2600 : 6000} />
        {!lite && <WaveGrid />}
        <Rig />
      </Canvas>
    </div>
  );
}
