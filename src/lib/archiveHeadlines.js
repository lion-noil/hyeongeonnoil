// 아카이브 헤드라인 추출·제목 생성 — pages/archive/[day].jsx 와 /en/archive 가 공유 (2026-10-09, [day].jsx 에서 이동)
// 입력 countries: { [country]: { summary } } (archiveDb.getDaySummaries / getRecentDaySummaries 결과)

// 헤드라인 우선 국가 순서 — 검색 수요가 큰 나라부터
const HEADLINE_ORDER = ["USA", "Korea", "China", "Japan", "UK", "Germany", "India", "HongKong"];

// 나라별 요약(summary_result)에서 "1. 🗞️ 제목" 꼴 기사 제목을 뽑는다. 제목 없으면 [].
export function extractHeadlines(countries, max = 3) {
  const order = [...HEADLINE_ORDER.filter((c) => countries[c]), ...Object.keys(countries).filter((c) => !HEADLINE_ORDER.includes(c))];
  const perCountry = order.map((c) =>
    String(countries[c]?.summary || "")
      .split("\n")
      .map((line) => line.match(/^\s*\d+\.\s*(?:🗞️|🗞)?\s*(.+?)\s*$/))
      .filter(Boolean)
      .map((m) => m[1].replace(/\s+/g, " ").trim())
      .filter((h) => h.length >= 4 && !/^✅|^🔥/.test(h)),
  );
  // 나라별로 돌아가며 1개씩(다양성), 부족하면 같은 나라 2번째
  const out = [];
  for (let round = 0; out.length < max && round < 3; round++) {
    for (const list of perCountry) {
      if (out.length >= max) break;
      const h = list[round];
      if (h && !out.includes(h)) out.push(h);
    }
  }
  return out;
}

// 제목 60자 안: "{헤드라인1}·{헤드라인2} — 10월 8일 세계 뉴스 요약 | NewsInsight". 헤드라인 없으면 예전 날짜형 제목.
export function buildArchiveTitle(day, headlines) {
  const [y, m, d] = day.split("-");
  if (!headlines.length) return `${y}년 ${Number(m)}월 ${Number(d)}일 세계 뉴스 요약 — NewsInsight`;
  const suffix = ` — ${Number(m)}월 ${Number(d)}일 세계 뉴스 요약 | NewsInsight`;
  const budget = Math.max(60 - suffix.length, 12);
  // 예산 안에 통째로 들어가는 첫 헤드라인을 우선, 없으면 1번을 어절 경계에서 자름
  let head = headlines.find((h) => h.length <= budget);
  if (!head) {
    const cut = headlines[0].slice(0, budget - 1);
    const sp = cut.lastIndexOf(" ");
    head = `${(sp >= budget * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,·:…]+$/, "")}…`;
  }
  const second = headlines.find((h) => h !== head && `${head}·${h}`.length <= budget);
  if (second) head = `${head}·${second}`;
  return head + suffix;
}
