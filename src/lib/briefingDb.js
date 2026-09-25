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
      return b ? { day, title: b.title || "", lead: b.lead || "", data_date: b.data_date || "", keywords: b.keywords || [] } : null;
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
