// 지구본 데이터·색 헬퍼 — three.js 없이 가져다 쓸 수 있게 분리(히어로 문구·범례가 3D 번들을 끌고 오지 않도록)
import { useMemo } from "react";
import { useWorldStateData } from "../../hooks/useWorldStateData";

export const CAPITALS = {
  USA: { lat: 38.9, lon: -77.0, name: "미국", flag: "🇺🇸" },
  UK: { lat: 51.5, lon: -0.13, name: "영국", flag: "🇬🇧" },
  Germany: { lat: 52.5, lon: 13.4, name: "독일", flag: "🇩🇪" },
  China: { lat: 39.9, lon: 116.4, name: "중국", flag: "🇨🇳" },
  Japan: { lat: 35.7, lon: 139.7, name: "일본", flag: "🇯🇵" },
  India: { lat: 28.6, lon: 77.2, name: "인도", flag: "🇮🇳" },
  Korea: { lat: 37.57, lon: 126.98, name: "한국", flag: "🇰🇷" },
  HongKong: { lat: 22.3, lon: 114.2, name: "홍콩", flag: "🇭🇰" },
};

export const FALLBACK_RELS = [
  { a: "USA", b: "UK", s: 5 }, { a: "USA", b: "Japan", s: 4 }, { a: "USA", b: "Korea", s: 4 },
  { a: "USA", b: "China", s: -3 }, { a: "UK", b: "Germany", s: 3 }, { a: "China", b: "Japan", s: -3 },
  { a: "China", b: "India", s: -2 }, { a: "Japan", b: "Korea", s: 2 }, { a: "India", b: "Korea", s: 2 },
  { a: "China", b: "HongKong", s: 3 }, { a: "Germany", b: "India", s: 2 },
];

export const relColor = (s) => (s >= 4 ? "#34f5a4" : s >= 2 ? "#7cf7c0" : s >= 0 ? "#ffd166" : s >= -2 ? "#ff8a4c" : "#ff4d6d");
export const moodColor = (v) => (v >= 7 ? "#34f5a4" : v >= 5 ? "#ffd166" : "#ff4d6d");

export function useGlobeData() {
  const { data, updatedAt } = useWorldStateData();
  const relations = useMemo(() => {
    const rs = Array.isArray(data?.relations) ? data.relations : [];
    const norm = rs
      .filter((r) => r && CAPITALS[r.a] && CAPITALS[r.b])
      .map((r) => ({ a: r.a, b: r.b, s: Number(r.score) || 0, label: r.label }));
    return norm.length ? norm : FALLBACK_RELS;
  }, [data]);
  return { countries: data?.countries || null, relations, updatedAt, live: !!data };
}
