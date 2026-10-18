// 서버 전용 — 허브 페이지 서버렌더 본문(HubSummary)용 getStaticProps 본체. (2026-10-18)
// 숫자 원천은 키워드 페이지와 같다: chart_data 일봉(getHubQuotes·getMarketOverview), 비트코인은 최신 브리핑 snapshot.
// 봇 허브(코인·CFD) 심볼 목록은 /api/config 와 같은 Redis(trading:{name}:config.symbols), 실패 시 hubContent 의 고정 목록.
// 어떤 조회가 실패해도 페이지는 고정 설명·링크·FAQ 로 렌더한다(숫자만 빠짐).
import { Redis } from "@upstash/redis";
import { chartParams } from "../constants/chartMeta";
import { HUBS, KO_LABEL, SYMBOL_INFO } from "./hubContent";
import { MARKET_TOPICS } from "./marketTopics";
import { getHubQuotes, getMarketOverview } from "./marketDataDb";
import { getLatestBriefing } from "./briefingDb";

// (cat:key) → /market slug (교차계산 토픽 제외)
const SLUG_BY_CATKEY = Object.fromEntries(MARKET_TOPICS.filter((t) => !t.computed).map((t) => [`${t.cat}:${t.key}`, t.slug]));

function withTimeout(p, ms, fallback) {
  return Promise.race([p, new Promise((resolve) => setTimeout(() => resolve(fallback), ms))]).catch(() => fallback);
}

async function loadSymbols(spec) {
  const fallback = spec.fallback || [];
  let list = fallback;
  if (spec.config) {
    const url = process.env.TRADING_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.TRADING_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) {
      const raw = await withTimeout(new Redis({ url, token }).hget(`trading:${spec.config}:config`, "symbols"), 4000, null);
      let arr = raw;
      if (typeof arr === "string") {
        const s = arr.trim();
        try {
          arr = s.startsWith("[") ? JSON.parse(s) : s.split(/[,\s]+/);
        } catch {
          arr = null;
        }
      }
      if (Array.isArray(arr)) {
        const clean = arr.map((x) => String(x).trim().toUpperCase()).filter(Boolean);
        if (clean.length) list = clean;
      }
    }
  }
  if (spec.exclude) list = list.filter((s) => !spec.exclude.includes(s));
  return list;
}

function quoteItemsForCats(cats) {
  const kindOf = (cat) => (cat === "treasury" ? "rate" : "price");
  return cats.flatMap((cat) => (chartParams[cat] || []).map(({ key, label }) => ({ cat, key, label: KO_LABEL[key] || label, kind: kindOf(cat) })));
}

// 브리핑 snapshot 항목 → 시세 행 (pct 는 전일 대비 %, ma 없음)
function snapQuote(b, key, label) {
  const s = (b?.snapshot || []).find((x) => x.key === key);
  if (!s || !Number.isFinite(Number(s.close))) return null;
  return {
    key,
    label,
    kind: "price",
    date: String(s.date || "").slice(0, 10),
    close: Number(s.close),
    dec: Number.isInteger(s.dec) ? s.dec : null,
    delta: s.pct != null && Number.isFinite(Number(s.pct)) ? Number(s.pct) : null, // Number(null)=0 함정 주의
    vsMa: s.vs_ma_pct != null && Number.isFinite(Number(s.vs_ma_pct)) ? Number(s.vs_ma_pct) : null,
    note: s.note ? String(s.note) : null,
    source: "briefing",
    briefingDay: b.day || null,
  };
}

/**
 * @param {keyof HUBS} hubKey
 * @returns {Promise<{quotes:Array, symbols:Array, links:Array, revalidate:number}>}
 *   quotes  일봉 허브: [{label, close, date, delta, vsMa, kind, slug}]
 *   symbols 봇 허브:   [{symbol, name, ref: quote|null}]
 *   links   이 허브의 /market 페이지 [{slug, name, close?, delta?, kind, dec}]
 */
export async function loadHubData(hubKey) {
  const hub = HUBS[hubKey];
  const out = { quotes: [], symbols: [], links: [] };

  const overview = await withTimeout(getMarketOverview(), 6000, []);
  const ovBySlug = Object.fromEntries((overview || []).map((o) => [o.slug, o]));
  const topics = hub.slugs ? MARKET_TOPICS.filter((t) => hub.slugs.includes(t.slug)) : MARKET_TOPICS;
  // 데이터가 있는 토픽만 링크(빈 시리즈 토픽은 404). 개요 조회 자체가 실패하면 전부 링크.
  out.links = topics
    .filter((t) => !overview.length || ovBySlug[t.slug])
    .map((t) => {
      const o = ovBySlug[t.slug];
      return { slug: t.slug, name: t.ko.name, kind: t.kind, dec: t.dec, close: o ? o.close : null, delta: o ? o.delta : null, date: o ? o.date : null };
    });

  if (hub.quoteCats) {
    const quotes = await withTimeout(getHubQuotes(quoteItemsForCats(hub.quoteCats)), 6000, []);
    out.quotes = quotes.map((q) => ({ ...q, slug: SLUG_BY_CATKEY[`${q.cat}:${q.key}`] || null }));
  }

  if (hub.symbols) {
    const syms = await loadSymbols(hub.symbols);
    const refs = syms.map((s) => SYMBOL_INFO[s]?.ref).filter(Boolean);
    const needBriefing = refs.some((r) => r.snap);
    const [briefing, dailyQuotes] = await Promise.all([
      needBriefing ? withTimeout(getLatestBriefing(), 5000, null) : null,
      withTimeout(getHubQuotes(refs.filter((r) => r.cat).map((r) => ({ cat: r.cat, key: r.key, label: r.label }))), 6000, []),
    ]);
    out.symbols = syms.map((symbol) => {
      const info = SYMBOL_INFO[symbol] || {};
      const r = info.ref;
      let ref = null;
      if (r?.snap) ref = snapQuote(briefing, r.snap, r.label);
      else if (r?.cat) {
        const q = dailyQuotes.find((x) => x.cat === r.cat && x.key === r.key);
        if (q) ref = { ...q, label: r.label, slug: SLUG_BY_CATKEY[`${r.cat}:${r.key}`] || null };
      }
      return { symbol, name: info.name || symbol, ref };
    });
  }

  // JSON 직렬화 — undefined 금지
  return JSON.parse(JSON.stringify(out));
}

// pages/*.jsx getStaticProps 공용 — 10분 ISR, 오류 시 2분 뒤 재시도
export async function hubStaticProps(hubKey) {
  try {
    return { props: { hub: await loadHubData(hubKey) }, revalidate: 600 };
  } catch {
    return { props: { hub: { quotes: [], symbols: [], links: [] } }, revalidate: 120 };
  }
}
