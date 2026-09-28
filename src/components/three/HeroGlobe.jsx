// 홈 히어로 3D 지구본 — 육지 점묘 + 대기광 + 8개국 마커(분위기 점수 색) + 관계 호(관계 점수 색, 흐르는 빛).
// 데이터: /api/world-state (세계정세 현황판과 같은 원천). 실데이터 없으면 목업 관계로 그림. (2026-09-28)
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import LAND from "./landDots.json";
import { CAPITALS, relColor, moodColor } from "./globeData";

const R = 5;
function toVec3(lat, lon, r = R) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

// ── 육지 점 ────────────────────────────────────────────────
const DOT_VERT = /* glsl */ `
  varying float vFacing;
  varying float vLat;
  uniform float uPixel;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vec3 n = normalize(wp.xyz);
    vFacing = dot(n, normalize(cameraPosition - wp.xyz));
    vLat = position.y / ${R.toFixed(1)};
    vec4 mv = viewMatrix * wp;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uPixel * 2.6 * (14.0 / -mv.z);
  }
`;
const DOT_FRAG = /* glsl */ `
  varying float vFacing;
  varying float vLat;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    vec3 col = mix(vec3(0.40, 0.91, 0.98), vec3(0.66, 0.55, 0.98), vLat * 0.5 + 0.5);
    float a = smoothstep(-0.05, 0.45, vFacing) * 0.9;
    gl_FragColor = vec4(col, a);
  }
`;
function LandDots({ pixel }) {
  const geo = useMemo(() => {
    const n = LAND.length / 2;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const v = toVec3(LAND[i * 2] / 10, LAND[i * 2 + 1] / 10, R * 1.002);
      pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  const uniforms = useMemo(() => ({ uPixel: { value: pixel } }), [pixel]);
  return (
    <points geometry={geo}>
      <shaderMaterial vertexShader={DOT_VERT} fragmentShader={DOT_FRAG} uniforms={uniforms} transparent depthWrite={false} />
    </points>
  );
}

// ── 대기광(프레넬) ──────────────────────────────────────────
const ATM_VERT = /* glsl */ `
  varying vec3 vN; varying vec3 vV;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const ATM_FRAG = /* glsl */ `
  varying vec3 vN; varying vec3 vV;
  void main() {
    float f = pow(1.0 - abs(dot(vN, vV)), 3.0);
    vec3 col = mix(vec3(0.35, 0.85, 1.0), vec3(0.62, 0.45, 1.0), f);
    gl_FragColor = vec4(col, f * 0.9);
  }
`;

// ── 관계 호 ────────────────────────────────────────────────
const ARC_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const ARC_FRAG = /* glsl */ `
  uniform vec3 uColor; uniform float uTime; uniform float uSpeed; uniform float uDash; uniform float uOffset;
  varying vec2 vUv;
  void main() {
    float t = vUv.x;
    float head = fract(uTime * uSpeed + uOffset);
    float dist = t - head; if (dist < 0.0) dist += 1.0;
    float pulse = exp(-dist * 9.0);
    float dash = uDash > 0.5 ? step(0.45, fract(t * 22.0)) : 1.0;
    float ends = smoothstep(0.0, 0.06, t) * smoothstep(1.0, 0.94, t);
    float a = (0.22 * dash + pulse * 0.95) * ends;
    gl_FragColor = vec4(uColor * (1.0 + pulse), a);
  }
`;
function Arc({ rel, index }) {
  const a = CAPITALS[rel.a], b = CAPITALS[rel.b];
  const [geo, uniforms] = useMemo(() => {
    const va = toVec3(a.lat, a.lon), vb = toVec3(b.lat, b.lon);
    const mid = va.clone().add(vb).multiplyScalar(0.5);
    const lift = R + va.distanceTo(vb) * 0.26 + 0.35;
    mid.normalize().multiplyScalar(lift);
    const curve = new THREE.QuadraticBezierCurve3(va, mid, vb);
    const w = 0.012 + Math.min(Math.abs(rel.s), 5) * 0.006;
    return [
      new THREE.TubeGeometry(curve, 80, w, 6, false),
      {
        uColor: { value: new THREE.Color(relColor(rel.s)) },
        uTime: { value: 0 },
        uSpeed: { value: 0.18 + (index % 4) * 0.04 },
        uDash: { value: rel.s < 0 ? 1 : 0 },
        uOffset: { value: (index * 0.137) % 1 },
      },
    ];
  }, [a, b, rel.s, index]);
  useFrame((_, dt) => { uniforms.uTime.value += dt; });
  return (
    <mesh geometry={geo}>
      <shaderMaterial vertexShader={ARC_VERT} fragmentShader={ARC_FRAG} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

// ── 나라 마커 ──────────────────────────────────────────────
function Marker({ code, score, occluder, onHover, active }) {
  const c = CAPITALS[code];
  const ring = useRef();
  const pos = useMemo(() => toVec3(c.lat, c.lon, R * 1.01), [c]);
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize()), [pos]);
  const color = moodColor(score);
  useFrame(({ clock }) => {
    if (!ring.current) return;
    const t = (clock.elapsedTime * 0.8 + code.length * 0.3) % 1;
    ring.current.scale.setScalar(1 + t * 2.4);
    ring.current.material.opacity = 0.8 * (1 - t);
  });
  return (
    <group position={pos} quaternion={quat}>
      <mesh onPointerOver={() => onHover(code)} onPointerOut={() => onHover(null)}>
        <sphereGeometry args={[active ? 0.13 : 0.09, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={ring}>
        <ringGeometry args={[0.12, 0.16, 32]} />
        <meshBasicMaterial color={color} transparent side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Html center distanceFactor={11} occlude={[occluder]} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }} position={[0, 0, 0.35]}>
        <div className={`globe-label${active ? " is-active" : ""}`}>
          <b>{c.name}</b>
          <i style={{ color }}>{Number.isFinite(score) ? score : "-"}</i>
        </div>
      </Html>
    </group>
  );
}

function Globe({ countries, relations, pixel, onHover, hovered }) {
  const core = useRef();
  return (
    <group rotation={[0.22, 0, 0]}>
      <mesh ref={core}>
        <sphereGeometry args={[R * 0.995, 64, 64]} />
        <meshBasicMaterial color="#060a1a" />
      </mesh>
      <mesh>
        <sphereGeometry args={[R * 1.16, 64, 64]} />
        <shaderMaterial vertexShader={ATM_VERT} fragmentShader={ATM_FRAG} transparent side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <LandDots pixel={pixel} />
      {relations.map((r, i) => (
        <Arc key={`${r.a}-${r.b}`} rel={r} index={i} />
      ))}
      {Object.keys(CAPITALS).map((code) => (
        <Marker key={code} code={code} score={countries?.[code]?.mood_score} occluder={core} onHover={onHover} active={hovered === code} />
      ))}
    </group>
  );
}

export default function HeroGlobe({ countries, relations, height = 520 }) {
  const [hovered, setHovered] = useState(null);
  const [pixel, setPixel] = useState(1);
  const [paused, setPaused] = useState(false);
  const wrap = useRef();
  useEffect(() => {
    setPixel(Math.min(window.devicePixelRatio || 1, 2));
    // 화면 밖으로 스크롤되면 렌더 정지
    const io = new IntersectionObserver(([e]) => setPaused(!e.isIntersecting), { threshold: 0 });
    if (wrap.current) io.observe(wrap.current);
    return () => io.disconnect();
  }, []);
  // 한국이 정면에 오도록 초기 카메라
  const cam = useMemo(() => {
    const k = toVec3(30, 125).normalize().multiplyScalar(18);
    return [k.x, k.y + 2.5, k.z];
  }, []);
  return (
    <div ref={wrap} className="hero-globe" style={{ height }}>
      <Canvas frameloop={paused ? "demand" : "always"} dpr={[1, 2]} camera={{ position: cam, fov: 42 }} gl={{ antialias: true, alpha: true }}>
        <Globe countries={countries} relations={relations} pixel={pixel} onHover={setHovered} hovered={hovered} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate={!hovered} autoRotateSpeed={0.45} rotateSpeed={0.5} enableDamping dampingFactor={0.08} minPolarAngle={Math.PI * 0.2} maxPolarAngle={Math.PI * 0.8} />
      </Canvas>
    </div>
  );
}
