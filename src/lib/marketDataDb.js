// 서버 전용 — 시세 키워드 페이지(/market)용 chart_data 조회·통계. (2026-10-09)
// 원천: Upstash 해시 chart_data[{cat}] = JSON { [symbol]: { data: [{date, close, ma100, envelope3_upper/lower, ...}] } } 일봉 100행.
// 규칙(News_scrap/app/시장브리핑.py market_snapshot 과 동일): 마지막 행은 오늘 진행 중 캔들일 수 있어 date < 오늘(KST) 만 종가로 취급.
// LLM 호출 없음 — 모든 문장·숫자는 이 통계에서만 나온다.
import { Redis } from "@upstash/redis";
import { MARKET_TOPICS, TOPIC_BY_SLUG } from "./marketTopics";

const KEY = "chart_data";
const STALE_DAYS = 7; // 마지막 종가가 이보다 오래되면 "데이터 지연"

function client() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function parse(v) {
  if (v == null) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(String(v));
  } catch {
    return null;
  }
}

export function todayKST() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}
function shiftDate(day, n) {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
}

// 원시 행 → 종가 시리즈(날짜 오름차순, 중복 날짜는 마지막 행, 오늘 제외)
function cleanRows(rows, today) {
  if (!Array.isArray(rows)) return [];
  const byDate = new Map();
  for (const r of rows) {
    const date = String(r?.date || "").slice(0, 10);
    const close = Number(r?.close);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(close) || date >= today) continue;
    byDate.set(date, {
      date,
      close,
      ma100: Number.isFinite(Number(r.ma100)) ? Number(r.ma100) : null,
      envUp: Number.isFinite(Number(r.envelope3_upper)) ? Number(r.envelope3_upper) : null,
      envLo: Number.isFinite(Number(r.envelope3_lower)) ? Number(r.envelope3_lower) : null,
    });
  }
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

// 교차환율: 100엔당 원 = usd_krw / usd_jpy × 100 (같은 날짜만). ma100·엔벨로프는 원천이 없어 null → 기간 평균으로 대체
function crossJpyKrw(krw, jpy) {
  const jpyByDate = new Map(jpy.map((r) => [r.date, r.close]));
  return krw
    .filter((r) => jpyByDate.has(r.date) && jpyByDate.get(r.date) !== 0)
    .map((r) => ({ date: r.date, close: (r.close / jpyByDate.get(r.date)) * 100, ma100: null, envUp: null, envLo: null }));
}

// 마지막 날짜 기준 n일(캘린더) 전 이하의 가장 최근 행
function rowAtOrBefore(series, day) {
  for (let i = series.length - 1; i >= 0; i--) if (series[i].date <= day) return series[i];
  return null;
}

function pct(a, b) {
  return b ? Math.round(((a / b) - 1) * 10000) / 100 : null;
}

// 시리즈 → 페이지 통계. 숫자는 반올림하지 않고(표시에서 dec 적용) 변화율만 소수 2자리.
export function computeStats(series, { kind, today }) {
  if (!series.length) return null;
  const last = series[series.length - 1];
  const prev = series.length > 1 ? series[series.length - 2] : null;
  const week = rowAtOrBefore(series.slice(0, -1), shiftDate(last.date, -7));
  const month = rowAtOrBefore(series.slice(0, -1), shiftDate(last.date, -30));
  let hi = series[0];
  let lo = series[0];
  for (const r of series) {
    if (r.close > hi.close) hi = r;
    if (r.close < lo.close) lo = r;
  }
  const isRate = kind === "rate";
  const diff = (a, b) => (a == null || b == null ? null : isRate ? Math.round((a - b) * 1000) / 10 : pct(a, b)); // 금리는 bp, 나머지 %
  const ma = last.ma100;
  const maIsPeriodAvg = ma == null;
  const periodAvg = series.reduce((s, r) => s + r.close, 0) / series.length;
  const maValue = ma != null ? ma : periodAvg;
  let envelope = null; // "above" | "below" | "inside"
  if (last.envUp != null && last.envLo != null) envelope = last.close > last.envUp ? "above" : last.close < last.envLo ? "below" : "inside";
  return {
    last: { date: last.date, close: last.close },
    prev: prev ? { date: prev.date, close: prev.close, chg: last.close - prev.close, delta: diff(last.close, prev.close) } : null,
    week: week ? { date: week.date, close: week.close, delta: diff(last.close, week.close) } : null,
    month: month ? { date: month.date, close: month.close, delta: diff(last.close, month.close) } : null,
    high: { date: hi.date, close: hi.close },
    low: { date: lo.date, close: lo.close },
    periodStart: series[0].date,
    count: series.length,
    ma: { value: maValue, isPeriodAvg: maIsPeriodAvg, delta: diff(last.close, maValue), diffAbs: last.close - maValue },
    envelope,
    envUp: last.envUp,
    envLo: last.envLo,
    stale: daysBetween(last.date, today) > STALE_DAYS,
    staleDays: daysBetween(last.date, today),
  };
}

// 카테고리 JSON 들을 한 번에 — 중복 hget 방지
async function loadCats(cats) {
  const r = client();
  if (!r) return {};
  const uniq = [...new Set(cats)];
  const raws = await Promise.all(uniq.map((c) => r.hget(KEY, c)));
  const out = {};
  uniq.forEach((c, i) => {
    out[c] = parse(raws[i]) || {};
  });
  return out;
}

function seriesFor(topic, cats, today) {
  const cat = cats[topic.cat] || {};
  if (topic.computed === "jpy_krw") {
    return crossJpyKrw(cleanRows(cat.usd_krw?.data, today), cleanRows(cat.usd_jpy?.data, today));
  }
  return cleanRows(cat[topic.key]?.data, today);
}

// 단일 토픽 — 페이지용. { topic(slug), series(최근 90행 {date,close,ma100}), stats } 또는 데이터 없으면 null
export async function getTopicData(slug, chartRows = 90) {
  const topic = TOPIC_BY_SLUG[slug];
  if (!topic) return null;
  const today = todayKST();
  const cats = await loadCats([topic.cat]);
  const series = seriesFor(topic, cats, today);
  if (!series.length) return null;
  const stats = computeStats(series, { kind: topic.kind, today });
  const chart = series.slice(-chartRows).map((r) => ({ date: r.date, close: r.close, ma100: r.ma100 }));
  return { slug, stats, chart, today };
}

// 전 토픽 요약 — 목록 페이지·홈·사이트맵. 데이터 없는 토픽은 제외. [{slug, last, prev}]
export async function getMarketOverview() {
  const today = todayKST();
  const cats = await loadCats(MARKET_TOPICS.map((t) => t.cat));
  const out = [];
  for (const topic of MARKET_TOPICS) {
    const series = seriesFor(topic, cats, today);
    if (!series.length) continue;
    const st = computeStats(series, { kind: topic.kind, today });
    out.push({ slug: topic.slug, date: st.last.date, close: st.last.close, delta: st.prev ? st.prev.delta : null, stale: st.stale });
  }
  return out;
}
