// JSON-LD 직렬화 — <script type="application/ld+json"> 안에 넣을 때 "<"를 < 로 이스케이프해
// "</script>" 주입을 막는다. (archive/[day]·briefing/[day]는 기존 방식 유지, 신규 페이지는 이 헬퍼 사용)
export const ORG = { "@type": "Organization", name: "현건노일 NewsInsight", url: "https://hyeongeonnoil.com" };

export function ldJson(obj) {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}
