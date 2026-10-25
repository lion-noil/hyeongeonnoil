// 디자인 시스템 — JS 쪽 단일 소스 (2026-10-25)
// CSS 토큰은 src/styles/globals.css :root 에 있고, SVG·three.js·인라인 스타일처럼 CSS 변수를 못 쓰는 곳이
// 여기 값을 가져다 쓴다. 두 파일의 색은 반드시 같이 바꾼다 (docs/DESIGN.md 참고).

// ── 의미 색 (CSS 의 --pos/--neg/--warn/--ok 와 동일) ──────────────────
export const COLOR = {
  text: "#eef2ff",
  text2: "#b8c0e0",
  muted: "#7d86ad",
  line: "rgba(148, 163, 255, 0.16)",
  lineStrong: "rgba(148, 163, 255, 0.32)",
  panel: "rgba(13, 18, 38, 0.72)",
  panelSolid: "#0b1022",
  accent: "#5eead4",
  accent2: "#a78bfa",
  accent3: "#f0abfc",
  cyan: "#67e8f9",
  ok: "#34f5a4",
  warn: "#ffd166",
  neg: "#ff4d6d",
  // 시세 등락 — 국내 관례(상승 빨강·하락 파랑)
  up: "#ff6b7a",
  down: "#5eb3ff",
};

// ── 관계(국가 간) 점수 → 색 — 지구본·세계정세 지도·범례가 전부 이걸 쓴다 ──
export const REL_SCALE = [
  { min: 4, key: "ally", label: "동맹", color: "#34f5a4", dash: false },
  { min: 2, key: "friend", label: "우호", color: "#7cf7c0", dash: false },
  { min: 0, key: "neutral", label: "중립", color: "#ffd166", dash: false },
  { min: -2, key: "tense", label: "긴장", color: "#ff8a4c", dash: true },
  { min: -Infinity, key: "hostile", label: "적대", color: "#ff4d6d", dash: true },
];
export const relStep = (s) => REL_SCALE.find((r) => s >= r.min) || REL_SCALE[REL_SCALE.length - 1];
export const relColor = (s) => relStep(s).color;
export const relLabel = (s) => relStep(s).label;

// ── 분위기 점수(0~10) → 색 ──
export const moodColor = (v) => (v >= 7 ? COLOR.ok : v >= 5 ? COLOR.warn : COLOR.neg);

// ── 뉴스 카테고리 칩 색 ──
export const CATEGORY_COLOR = {
  "지정학": "#ff8a4c",
  "경제·시장": "#5eb3ff",
  "정치": "#c084fc",
  "산업·기술": "#34f5a4",
  "사회·기타": "#9aa3c7",
};
export const categoryColor = (cat) => CATEGORY_COLOR[String(cat || "")] || CATEGORY_COLOR["사회·기타"];

// ── 나라 메타 (내부 키 → 한글명·ISO2) — 지도·카드·캘린더 공용 ──
export const COUNTRY = {
  USA: { ko: "미국", iso: "US" },
  UK: { ko: "영국", iso: "GB" },
  Germany: { ko: "독일", iso: "DE" },
  China: { ko: "중국", iso: "CN" },
  Japan: { ko: "일본", iso: "JP" },
  India: { ko: "인도", iso: "IN" },
  Korea: { ko: "한국", iso: "KR" },
  HongKong: { ko: "홍콩", iso: "HK" },
};
const ISO_TO_KEY = Object.fromEntries(Object.entries(COUNTRY).map(([k, v]) => [v.iso, k]));
// 내부 키("Korea")든 ISO("KR")든 받아 내부 키로
export const countryKey = (v) => (COUNTRY[v] ? v : ISO_TO_KEY[String(v || "").toUpperCase()] || null);
export const countryKo = (v) => COUNTRY[countryKey(v)]?.ko || String(v || "");
export const countryIso = (v) => COUNTRY[countryKey(v)]?.iso || null;
