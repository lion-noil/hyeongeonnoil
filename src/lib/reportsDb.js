// 서버 전용 트레이딩봇 보고서 조회 (getStaticProps·/api/reports 공용)
// 원천: Upstash Redis 해시 trading:reports — News_scrap/app/report_store.py 가 발행
//   field = "{kind}:{label}" (monthly:2026-08 / deep:2026-08 / weekly:2026-W38)
//   value = JSON {id, kind, label, title, generated_at, md}
import { Redis } from "@upstash/redis";

export const REPORTS_KEY = "trading:reports";
export const KINDS = ["perf", "monthly", "deep", "weekly"];
export const KIND_KO = { perf: "성적표", monthly: "월간", deep: "월간 심층", weekly: "주간" };

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

// URL 슬러그 ↔ id.  슬러그 = "{kind}-{label}" (예: monthly-2026-08), id = "{kind}:{label}"
export function slugToId(slug) {
  const m = /^(perf|monthly|deep|weekly)-([0-9A-Za-z-]{4,20})$/.exec(String(slug || ""));
  return m ? `${m[1]}:${m[2]}` : null;
}
export function idToSlug(id) {
  const m = /^(perf|monthly|deep|weekly):([0-9A-Za-z-]{4,20})$/.exec(String(id || ""));
  return m ? `${m[1]}-${m[2]}` : null;
}

function sortMeta(a, b) {
  if ((a.kind === "perf") !== (b.kind === "perf")) return a.kind === "perf" ? -1 : 1; // 성적표는 항상 맨 위
  if (a.label !== b.label) return a.label < b.label ? 1 : -1; // 최신 라벨 먼저
  return KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind);       // 같은 라벨: monthly→deep→weekly
}

// 메타 목록(md 제외) — 최신순
export async function listReports() {
  const redis = client();
  if (!redis) return [];
  const raw = (await redis.hgetall(REPORTS_KEY)) || {};
  const out = [];
  for (const v of Object.values(raw)) {
    const d = parse(v);
    if (!d || !KINDS.includes(d.kind) || !d.label) continue;
    const { md, data, ...meta } = d;   // 목록엔 본문(md)·구조화 데이터(data) 제외
    out.push({ ...meta, slug: idToSlug(d.id), chars: (md || "").length, hasData: !!data });
  }
  return out.sort(sortMeta);
}

// 단일 보고서(md 포함)
export async function getReport(id) {
  const redis = client();
  if (!redis || !idToSlug(id)) return null;
  const d = parse(await redis.hget(REPORTS_KEY, id));
  if (!d || !d.md) return null;
  return { ...d, slug: idToSlug(d.id) };
}
