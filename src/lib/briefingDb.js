// 서버 전용 시장 브리핑 조회 (getStaticProps·사이트맵·RSS 공용)
// 원천: Upstash 해시 market_briefings — News_scrap/app/시장브리핑.py 가 매일 아침 발행
//   field = "YYYY-MM-DD", value = JSON {day, title, lead, sections[], keywords[], movers[], snapshot[], data_date, news_day, ...}
//   market_briefings:latest = 최신 day
import { Redis } from "@upstash/redis";

export const KEY = "market_briefings";
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function client() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function parse(v) {
  if (v == null) return null;
  if (typeof v === "object") return v; // @upstash/redis 가 자동 JSON 파싱한 경우
  try {
    return JSON.parse(String(v));
  } catch {
    return null;
  }
}

// 최신순 날짜 목록 — 사이트맵·이전/다음 링크
export async function listBriefingDays() {
  const r = client();
  if (!r) return [];
  const keys = (await r.hkeys(KEY)) || [];
  return keys.filter((d) => DAY_RE.test(d)).sort().reverse();
}

// 목록 페이지·RSS용 요약(제목·리드) — 해시 전체(하루 5KB 안팎)
export async function listBriefings(limit = 60) {
  const r = client();
  if (!r) return [];
  const all = (await r.hgetall(KEY)) || {};
  return Object.entries(all)
    .filter(([day]) => DAY_RE.test(day))
    .map(([day, v]) => {
      const b = parse(v);
      if (!b) return null;
      const en = b.en && typeof b.en === "object" && b.en.title ? b.en : null;
      return {
        day,
        title: b.title || "",
        lead: b.lead || "",
        data_date: b.data_date || "",
        keywords: b.keywords || [],
        has_en: !!en, // 영문판 존재 여부 — /en/briefing 목록·사이트맵·hreflang 판정 (2026-10-09)
        en_title: en ? en.title : "",
        en_lead: en ? en.lead || "" : "",
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.day < b.day ? 1 : -1))
    .slice(0, limit);
}

export async function getBriefing(day) {
  if (!DAY_RE.test(String(day || ""))) return null;
  const r = client();
  if (!r) return null;
  return parse(await r.hget(KEY, day));
}

// 최신 브리핑 day — market_briefings:latest 키, 없으면 해시 키 중 최대
export async function getLatestBriefingDay() {
  const r = client();
  if (!r) return null;
  const v = await r.get("market_briefings:latest");
  if (typeof v === "string" && DAY_RE.test(v)) return v;
  const days = await listBriefingDays();
  return days[0] || null;
}

// 최신 브리핑 전문 (홈 서버렌더 블록·시세 페이지 '관련 뉴스')
export async function getLatestBriefing() {
  const day = await getLatestBriefingDay();
  return day ? getBriefing(day) : null;
}

// 영문판(b.en)이 있는 브리핑만 — /en/briefing 목록·사이트맵. 최신순 [{day, title, lead, data_date}]
export async function listBriefingsEn(limit = 60) {
  const all = await listBriefings(1000);
  return all
    .filter((b) => b.has_en)
    .slice(0, limit)
    .map((b) => ({ day: b.day, title: b.en_title, lead: b.en_lead, data_date: b.data_date }));
}

// 시세 페이지 '관련 뉴스' 발췌 — 해당 section 본문(ko 또는 en) + 뉴스 제목. en 요청인데 영문이 없으면 본문 생략
export function briefingExcerpt(b, sectionKey, lang = "ko") {
  if (!b || !b.day) return null;
  const hasEn = !!(b.en && typeof b.en === "object" && b.en.title);
  const src = lang === "en" ? (hasEn ? b.en : null) : b;
  const sec = src ? (src.sections || []).find((s) => s.key === sectionKey) : null;
  return {
    day: b.day,
    title: lang === "en" && hasEn ? b.en.title : b.title || "",
    sectionHeading: sec ? sec.heading || "" : "",
    sectionBody: sec ? sec.body || "" : "",
    news_items: (b.news_items || []).slice(0, 5).map((n) => ({ title: n.title || "", category: n.category || "" })),
    hasEn,
  };
}
