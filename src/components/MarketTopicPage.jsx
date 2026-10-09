// 시세 키워드 페이지 공통 렌더러 — /market/[slug](ko)·/en/market/[slug](en) 이 사전만 바꿔 쓴다. (2026-10-09)
// 전부 서버 렌더 텍스트. 숫자는 marketDataDb.computeStats 결과에서만 나오고 LLM 호출 없음.
// 차트는 외부 JS 없이 <svg><path> 로 그린다(최근 90 거래일 종가 + 100일 이동평균).
import Head from "next/head";
import Link from "next/link";
import { ldJson } from "../lib/jsonLd";
import { MARKET_TOPICS } from "../lib/marketTopics";

const SITE = "https://hyeongeonnoil.com";
const box = { maxWidth: 780, margin: "0 auto", padding: "8px 16px 40px", color: "#eee" };
const card = { background: "var(--panel-2)", borderRadius: 10, padding: "16px 18px", marginBottom: 16 };
const h2 = { color: "#00ffcc", fontSize: 18, marginTop: 0 };
const UP = "#ff6b6b";
const DOWN = "#4dabf7";

const MONTH_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtNum(v, dec) {
  if (v == null || !Number.isFinite(Number(v))) return "-";
  return Number(v).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtDelta(delta, kind, dec = 2) {
  if (delta == null) return "-";
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  const abs = Math.abs(delta);
  return kind === "rate" ? `${sign}${abs.toFixed(1)}bp` : `${sign}${abs.toFixed(dec)}%`;
}
function color(v) {
  const n = Number(v);
  return n > 0 ? UP : n < 0 ? DOWN : "#bbb";
}
function dateParts(day) {
  const [y, m, d] = String(day).split("-").map(Number);
  return { y, m, d };
}
// 한국어 주격 조사 — 끝 글자(닫는 괄호 제외)가 한글이면 받침 유무로 은/는, 영문·숫자면 "는"(DAX는, 102.19는)
function eun(word) {
  const w = String(word).replace(/[)\]]+$/, "");
  const ch = w.charAt(w.length - 1);
  if (!/[가-힣]/.test(ch)) return "는";
  return (ch.charCodeAt(0) - 0xac00) % 28 ? "은" : "는";
}

// 언어 사전 — 문장 생성 함수 포함
const DICT = {
  ko: {
    locale: "ko",
    ogLocale: "ko_KR",
    base: "/market",
    briefingBase: "/briefing",
    siteName: "NewsInsight",
    crumbRoot: "시세",
    shortDate: (day) => { const { m, d } = dateParts(day); return `${m}월 ${d}일`; },
    longDate: (day) => { const { y, m, d } = dateParts(day); return `${y}년 ${m}월 ${d}일`; },
    val: (v, t) => `${fmtNum(v, t.dec)}${t.ko.unit && t.ko.unit !== "%" ? t.ko.unit.split("/")[0] : t.ko.unit}`,
    title: (t, st) => {
      const head = `${t.ko.seo} | ${DICT.ko.shortDate(st.last.date)} 종가 ${DICT.ko.val(st.last.close, t)}(${fmtDelta(st.prev?.delta, t.kind)})`;
      const full = `${head} 주간·월간 추이 — NewsInsight`;
      return full.length <= 60 ? full : `${head} 추이 — NewsInsight`; // 60자 넘으면 짧은 꼬리
    },
    h1: (t, st) => `${t.ko.name} — ${DICT.ko.shortDate(st.last.date)} 종가 ${DICT.ko.val(st.last.close, t)} (${fmtDelta(st.prev?.delta, t.kind)})`,
    desc: (t, st) => `${t.ko.name} ${DICT.ko.longDate(st.last.date)} 종가 ${DICT.ko.val(st.last.close, t)}, 전일 대비 ${fmtDelta(st.prev?.delta, t.kind)}, 1주 ${fmtDelta(st.week?.delta, t.kind)}, 1개월 ${fmtDelta(st.month?.delta, t.kind)}. ${st.ma.isPeriodAvg ? "기간 평균" : "100일 이동평균"} 대비 ${fmtDelta(st.ma.delta, t.kind)}. 매일 종가 갱신, 수치 표·추이 차트·관련 뉴스.`,
    dataLine: (st, t) => `데이터 기준 ${st.last.date} 종가 · 보유 기간 ${st.periodStart} ~ ${st.last.date} (${st.count}거래일)${t.computed ? " · 달러/원·달러/엔 종가로 계산한 교차환율" : ""}`,
    stale: (st) => `데이터 지연: 마지막 종가가 ${st.staleDays}일 전(${st.last.date})입니다. 원천 갱신이 멈춘 상태일 수 있습니다.`,
    summary: (t, st) => {
      const n = t.ko.name;
      const s = [];
      s.push(`${n}${eun(n)} ${DICT.ko.longDate(st.last.date)} ${DICT.ko.val(st.last.close, t)}에 마감했습니다.`);
      if (st.prev) s.push(` 전 거래일(${DICT.ko.shortDate(st.prev.date)}) ${DICT.ko.val(st.prev.close, t)} 대비 ${fmtDelta(st.prev.delta, t.kind)}${t.kind === "rate" ? "" : `(${st.prev.chg > 0 ? "+" : ""}${fmtNum(st.prev.chg, t.dec)})`}입니다.`);
      if (st.week) s.push(` 1주 전(${DICT.ko.shortDate(st.week.date)}, ${DICT.ko.val(st.week.close, t)})보다 ${fmtDelta(st.week.delta, t.kind)}`);
      if (st.month) s.push(`${st.week ? ", " : " "}1개월 전(${DICT.ko.shortDate(st.month.date)}, ${DICT.ko.val(st.month.close, t)})보다 ${fmtDelta(st.month.delta, t.kind)} 움직였습니다.`);
      else if (st.week) s.push(" 움직였습니다.");
      s.push(` 보유 데이터 기간(${st.periodStart}~) 최고는 ${DICT.ko.shortDate(st.high.date)} ${DICT.ko.val(st.high.close, t)}, 최저는 ${DICT.ko.shortDate(st.low.date)} ${DICT.ko.val(st.low.close, t)}입니다.`);
      const maName = st.ma.isPeriodAvg ? `보유 기간 평균(${st.count}거래일)` : "100일 이동평균";
      s.push(` ${maName} ${DICT.ko.val(st.ma.value, t)}보다 ${fmtDelta(st.ma.delta, t.kind)} ${st.ma.delta > 0 ? "높은" : st.ma.delta < 0 ? "낮은" : "같은"} 위치입니다.`);
      if (st.envelope) s.push(st.envelope === "inside" ? ` 100일 평균 ±3% 엔벨로프(${DICT.ko.val(st.envLo, t)}~${DICT.ko.val(st.envUp, t)}) 안에 있습니다.` : ` 100일 평균 ±3% 엔벨로프 ${st.envelope === "above" ? `상단(${DICT.ko.val(st.envUp, t)})을 위로` : `하단(${DICT.ko.val(st.envLo, t)})을 아래로`} 벗어난 상태입니다.`);
      return s.join("");
    },
    tableTitle: "수치 표",
    th: ["구분", "날짜", "값", "현재 대비"],
    rows: { prev: "전 거래일", week: "1주 전", month: "1개월 전", high: "기간 최고", low: "기간 최저", ma: "100일 이동평균", avg: "기간 평균" },
    chartTitle: "최근 90거래일 추이",
    chartLegend: (hasMa) => (hasMa ? "실선: 종가 · 점선: 100일 이동평균" : "실선: 종가"),
    chartAria: (t, st) => `${t.ko.name} 최근 90거래일 종가 추이 차트, 마지막 ${st.last.date} ${DICT.ko.val(st.last.close, t)}`,
    newsTitle: "관련 뉴스",
    newsFrom: (b) => `${DICT.ko.longDate(b.day)} 시장 브리핑에서`,
    newsLink: (b) => `${DICT.ko.longDate(b.day)} 시장 브리핑 전문 →`,
    newsNone: "관련 브리핑을 불러오지 못했습니다.",
    faqTitle: "자주 묻는 질문",
    faq: (t, st) => {
      const n = t.ko.name;
      const maName = st.ma.isPeriodAvg ? "보유 기간 평균" : "100일 이동평균";
      return [
        {
          q: `${n}${eun(n)} 지금 ${maName}보다 높은가요?`,
          a: `${DICT.ko.longDate(st.last.date)} 종가 ${DICT.ko.val(st.last.close, t)}${eun(DICT.ko.val(st.last.close, t))} ${maName} ${DICT.ko.val(st.ma.value, t)}보다 ${fmtDelta(st.ma.delta, t.kind)} ${st.ma.delta > 0 ? "높습니다" : st.ma.delta < 0 ? "낮습니다" : "같습니다"}.${st.envelope ? ` 100일 평균 ±3% 엔벨로프 기준으로는 ${st.envelope === "inside" ? "밴드 안" : st.envelope === "above" ? "상단 위" : "하단 아래"}입니다.` : ""}`,
        },
        {
          q: `${n}${eun(n)} 최근 1주일과 1개월 동안 얼마나 움직였나요?`,
          a: `${st.week ? `1주 전(${st.week.date}) ${DICT.ko.val(st.week.close, t)}에서 ${fmtDelta(st.week.delta, t.kind)}` : "1주 전 데이터 없음"}, ${st.month ? `1개월 전(${st.month.date}) ${DICT.ko.val(st.month.close, t)}에서 ${fmtDelta(st.month.delta, t.kind)}` : "1개월 전 데이터 없음"} 변했습니다(${st.last.date} 종가 기준).`,
        },
        {
          q: `최근 ${st.count}거래일 중 ${n}의 최고·최저는 언제였나요?`,
          a: `${st.periodStart}부터 ${st.last.date}까지 최고는 ${st.high.date} ${DICT.ko.val(st.high.close, t)}, 최저는 ${st.low.date} ${DICT.ko.val(st.low.close, t)}입니다. 현재 종가는 최고 대비 ${fmtDelta(t.kind === "rate" ? Math.round((st.last.close - st.high.close) * 1000) / 10 : Math.round((st.last.close / st.high.close - 1) * 10000) / 100, t.kind)} 위치입니다.`,
        },
      ];
    },
    othersTitle: "다른 시세 페이지",
    briefingCta: "매일 아침 시장 브리핑 보기 →",
    enCta: "English version",
    disclaimer: "이 페이지는 공개 시세 데이터를 자동으로 정리한 정보 제공 목적의 자료이며 투자 권유가 아닙니다. 수치는 표의 원 데이터 기준이고 '전망'은 과거 추이와 평균 대비 위치를 뜻합니다.",
    noteCross: "교차환율은 달러/원 종가 ÷ 달러/엔 종가 × 100 으로 계산한 값이라 은행 고시 환율과 다를 수 있습니다. 100일 이동평균 대신 보유 기간 평균을 씁니다.",
    noteRate: "금리의 변화는 bp(0.01%p) 단위입니다.",
    section: "시세",
  },
  en: {
    locale: "en",
    ogLocale: "en_US",
    base: "/en/market",
    briefingBase: "/en/briefing",
    siteName: "NewsInsight",
    crumbRoot: "Markets",
    shortDate: (day) => { const { m, d } = dateParts(day); return `${MONTH_EN[m - 1]} ${d}`; },
    longDate: (day) => { const { y, m, d } = dateParts(day); return `${MONTH_EN[m - 1]} ${d}, ${y}`; },
    val: (v, t) => `${fmtNum(v, t.dec)}${t.en.unit === "%" ? "%" : t.en.unit ? ` ${t.en.unit}` : ""}`,
    title: (t, st) => `${t.en.seo} — ${DICT.en.shortDate(st.last.date)} close ${fmtNum(st.last.close, t.dec)}${t.kind === "rate" ? "%" : ""} (${fmtDelta(st.prev?.delta, t.kind)}) | NewsInsight`,
    h1: (t, st) => `${t.en.name} — ${DICT.en.shortDate(st.last.date)} close ${DICT.en.val(st.last.close, t)} (${fmtDelta(st.prev?.delta, t.kind)})`,
    desc: (t, st) => `${t.en.name} closed at ${DICT.en.val(st.last.close, t)} on ${DICT.en.longDate(st.last.date)}: ${fmtDelta(st.prev?.delta, t.kind)} day over day, ${fmtDelta(st.week?.delta, t.kind)} over 1 week, ${fmtDelta(st.month?.delta, t.kind)} over 1 month, ${fmtDelta(st.ma.delta, t.kind)} vs the ${st.ma.isPeriodAvg ? "period average" : "100-day moving average"}. Daily close, table, chart and related news.`,
    dataLine: (st, t) => `Data as of ${st.last.date} close · coverage ${st.periodStart} to ${st.last.date} (${st.count} trading days)${t.computed ? " · cross rate computed from USD/KRW and USD/JPY closes" : ""}`,
    stale: (st) => `Data delay: the latest close is ${st.staleDays} days old (${st.last.date}). The upstream feed may have stopped updating.`,
    summary: (t, st) => {
      const n = t.en.name;
      const s = [];
      s.push(`${n} closed at ${DICT.en.val(st.last.close, t)} on ${DICT.en.longDate(st.last.date)}.`);
      if (st.prev) s.push(` That is ${fmtDelta(st.prev.delta, t.kind)}${t.kind === "rate" ? "" : ` (${st.prev.chg > 0 ? "+" : ""}${fmtNum(st.prev.chg, t.dec)})`} from the previous session (${DICT.en.shortDate(st.prev.date)}, ${DICT.en.val(st.prev.close, t)}).`);
      if (st.week) s.push(` Versus one week earlier (${DICT.en.shortDate(st.week.date)}, ${DICT.en.val(st.week.close, t)}) it is ${fmtDelta(st.week.delta, t.kind)}`);
      if (st.month) s.push(`${st.week ? ", and" : " It is"} ${fmtDelta(st.month.delta, t.kind)} versus one month earlier (${DICT.en.shortDate(st.month.date)}, ${DICT.en.val(st.month.close, t)}).`);
      else if (st.week) s.push(".");
      s.push(` Over the available data (since ${st.periodStart}) the high was ${DICT.en.val(st.high.close, t)} on ${DICT.en.shortDate(st.high.date)} and the low was ${DICT.en.val(st.low.close, t)} on ${DICT.en.shortDate(st.low.date)}.`);
      const maName = st.ma.isPeriodAvg ? `period average (${st.count} trading days)` : "100-day moving average";
      s.push(` The close is ${fmtDelta(st.ma.delta, t.kind)} ${st.ma.delta > 0 ? "above" : st.ma.delta < 0 ? "below" : "at"} the ${maName} of ${DICT.en.val(st.ma.value, t)}.`);
      if (st.envelope) s.push(st.envelope === "inside" ? ` It sits inside the ±3% envelope around the 100-day average (${DICT.en.val(st.envLo, t)} to ${DICT.en.val(st.envUp, t)}).` : ` It is ${st.envelope === "above" ? `above the upper (${DICT.en.val(st.envUp, t)})` : `below the lower (${DICT.en.val(st.envLo, t)})`} band of the ±3% envelope around the 100-day average.`);
      return s.join("");
    },
    tableTitle: "Key figures",
    th: ["Item", "Date", "Value", "vs latest"],
    rows: { prev: "Previous session", week: "1 week ago", month: "1 month ago", high: "Period high", low: "Period low", ma: "100-day moving average", avg: "Period average" },
    chartTitle: "Last 90 trading days",
    chartLegend: (hasMa) => (hasMa ? "Solid: close · Dashed: 100-day moving average" : "Solid: close"),
    chartAria: (t, st) => `${t.en.name} daily close over the last 90 trading days, latest ${st.last.date} ${DICT.en.val(st.last.close, t)}`,
    newsTitle: "Related news",
    newsFrom: (b) => `From the ${DICT.en.longDate(b.day)} market briefing`,
    newsLink: (b) => `Read the ${DICT.en.longDate(b.day)} market briefing →`,
    newsNone: "The latest briefing could not be loaded.",
    faqTitle: "Frequently asked questions",
    faq: (t, st) => {
      const n = t.en.name;
      const maName = st.ma.isPeriodAvg ? "period average" : "100-day moving average";
      return [
        {
          q: `Is ${n} above its ${maName} right now?`,
          a: `The ${DICT.en.longDate(st.last.date)} close of ${DICT.en.val(st.last.close, t)} is ${fmtDelta(st.ma.delta, t.kind)} ${st.ma.delta > 0 ? "above" : st.ma.delta < 0 ? "below" : "at"} the ${maName} of ${DICT.en.val(st.ma.value, t)}.${st.envelope ? ` Relative to the ±3% envelope around the 100-day average it is ${st.envelope === "inside" ? "inside the band" : st.envelope === "above" ? "above the upper band" : "below the lower band"}.` : ""}`,
        },
        {
          q: `How much has ${n} moved over the past week and month?`,
          a: `${st.week ? `${fmtDelta(st.week.delta, t.kind)} from ${DICT.en.val(st.week.close, t)} one week earlier (${st.week.date})` : "No one-week-earlier data"}, and ${st.month ? `${fmtDelta(st.month.delta, t.kind)} from ${DICT.en.val(st.month.close, t)} one month earlier (${st.month.date})` : "no one-month-earlier data"}, based on the ${st.last.date} close.`,
        },
        {
          q: `When were the high and low of ${n} over the last ${st.count} trading days?`,
          a: `Between ${st.periodStart} and ${st.last.date} the high was ${DICT.en.val(st.high.close, t)} on ${st.high.date} and the low was ${DICT.en.val(st.low.close, t)} on ${st.low.date}. The latest close is ${fmtDelta(t.kind === "rate" ? Math.round((st.last.close - st.high.close) * 1000) / 10 : Math.round((st.last.close / st.high.close - 1) * 10000) / 100, t.kind)} from the high.`,
        },
      ];
    },
    othersTitle: "Other market pages",
    briefingCta: "Daily market briefing →",
    enCta: "한국어 페이지",
    disclaimer: "This page is an automated summary of public market data for information only and is not investment advice. Figures come from the table's source data; 'outlook' here means past trend and position relative to averages.",
    noteCross: "The cross rate is USD/KRW close ÷ USD/JPY close × 100 and may differ from bank-quoted rates. The period average is used instead of a 100-day moving average.",
    noteRate: "Yield changes are in basis points (bp, 0.01 percentage point).",
    section: "Markets",
  },
};

// ── SVG 라인 차트(서버 렌더) ───────────────────────────────────────────
function LineChart({ rows, dec, aria, kind }) {
  const W = 720;
  const H = 260;
  const L = 60;
  const R = 14;
  const T = 14;
  const B = 30;
  const pts = rows.filter((r) => Number.isFinite(r.close));
  if (pts.length < 2) return null;
  const maPts = pts.map((r, i) => ({ i, v: r.ma100 })).filter((p) => Number.isFinite(p.v));
  const values = [...pts.map((r) => r.close), ...maPts.map((p) => p.v)];
  let min = Math.min(...values);
  let max = Math.max(...values);
  const pad = (max - min || Math.abs(max) || 1) * 0.06;
  min -= pad;
  max += pad;
  const x = (i) => L + (i / (pts.length - 1)) * (W - L - R);
  const y = (v) => T + (1 - (v - min) / (max - min)) * (H - T - B);
  const path = pts.map((r, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(r.close).toFixed(1)}`).join(" ");
  // MA는 연속 구간만 잇는다(중간 결손은 끊김)
  let maPath = "";
  let prevI = -2;
  for (const p of maPts) {
    maPath += `${p.i === prevI + 1 ? "L" : "M"}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)} `;
    prevI = p.i;
  }
  const ticks = [0, 1, 2, 3, 4].map((k) => min + ((max - min) * k) / 4);
  const tickDec = kind === "rate" ? 2 : max - min < 5 ? Math.min(dec, 3) : max >= 10000 ? 0 : Math.min(dec, 1);
  const xi = [0, Math.floor((pts.length - 1) / 2), pts.length - 1];
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} style={{ width: "100%", height: "auto", display: "block" }}>
      <title>{aria}</title>
      {ticks.map((v, k) => (
        <g key={k}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="rgba(148,163,255,0.16)" strokeWidth="1" />
          <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#7d86ad">{fmtNum(v, tickDec)}</text>
        </g>
      ))}
      {xi.map((i) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"} fontSize="11" fill="#7d86ad">
          {pts[i].date.slice(5)}
        </text>
      ))}
      {maPath && <path d={maPath.trim()} fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="5 4" />}
      <path d={path} fill="none" stroke="#67e8f9" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(pts.length - 1)} cy={y(last.close)} r="4" fill="#67e8f9" stroke="#04060f" strokeWidth="2" />
      <text x={Math.min(x(pts.length - 1), W - R - 4)} y={y(last.close) - 10} textAnchor="end" fontSize="12" fill="#eef2ff" fontWeight="600">
        {fmtNum(last.close, dec)}
      </text>
    </svg>
  );
}

// 전일·주·월·최고·최저 표 — 값은 dec, 변화는 % 또는 bp
function FiguresTable({ t, st, d }) {
  const unitVal = (v) => d.val(v, t);
  const rel = (v) => fmtDelta(t.kind === "rate" ? Math.round((st.last.close - v) * 1000) / 10 : Math.round((st.last.close / v - 1) * 10000) / 100, t.kind);
  const items = [
    ["prev", st.prev], ["week", st.week], ["month", st.month], ["high", st.high], ["low", st.low],
  ].filter(([, r]) => r);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ color: "#999", textAlign: "right" }}>
            {d.th.map((h, i) => (
              <th key={h} style={{ textAlign: i === 0 ? "left" : "right", padding: "6px 4px" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderTop: "1px solid var(--line)", textAlign: "right", color: "#fff", fontWeight: 600 }}>
            <td style={{ textAlign: "left", padding: "7px 4px" }}>{d.locale === "ko" ? "최근 종가" : "Latest close"}</td>
            <td style={{ padding: "7px 4px" }}>{st.last.date}</td>
            <td style={{ padding: "7px 4px" }}>{unitVal(st.last.close)}</td>
            <td style={{ padding: "7px 4px" }}>-</td>
          </tr>
          {items.map(([k, r]) => (
            <tr key={k} style={{ borderTop: "1px solid var(--line)", textAlign: "right" }}>
              <td style={{ textAlign: "left", padding: "7px 4px", color: "#ddd" }}>{d.rows[k]}</td>
              <td style={{ padding: "7px 4px", color: "#999" }}>{r.date}</td>
              <td style={{ padding: "7px 4px" }}>{unitVal(r.close)}</td>
              <td style={{ padding: "7px 4px", color: color(st.last.close - r.close) }}>{rel(r.close)}</td>
            </tr>
          ))}
          <tr style={{ borderTop: "1px solid var(--line)", textAlign: "right" }}>
            <td style={{ textAlign: "left", padding: "7px 4px", color: "#ddd" }}>{st.ma.isPeriodAvg ? d.rows.avg : d.rows.ma}</td>
            <td style={{ padding: "7px 4px", color: "#999" }}>{st.last.date}</td>
            <td style={{ padding: "7px 4px" }}>{unitVal(st.ma.value)}</td>
            <td style={{ padding: "7px 4px", color: color(st.ma.delta) }}>{fmtDelta(st.ma.delta, t.kind)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// hreflang 세트 — ko/en 상호 참조, x-default 는 ko
export function AlternateLinks({ koPath, enPath }) {
  return (
    <>
      <link rel="alternate" hrefLang="ko" href={`${SITE}${koPath}`} key="alt-ko" />
      <link rel="alternate" hrefLang="en" href={`${SITE}${enPath}`} key="alt-en" />
      <link rel="alternate" hrefLang="x-default" href={`${SITE}${koPath}`} key="alt-x" />
    </>
  );
}

/**
 * @param {object} p
 * @param {"ko"|"en"} p.lang
 * @param {object} p.topic   MARKET_TOPICS 항목
 * @param {object} p.data    getTopicData 결과 {stats, chart, today}
 * @param {object|null} p.briefing  최신 브리핑 발췌 {day, title, sectionHeading, sectionBody, news_items[], hasEn}
 * @param {Array} p.others   getMarketOverview 결과(다른 페이지 링크용)
 */
export default function MarketTopicPage({ lang, topic: t, data, briefing: b, others = [] }) {
  const d = DICT[lang];
  const st = data.stats;
  const L = t[lang];
  const path = `${d.base}/${t.slug}`;
  const url = `${SITE}${path}`;
  const title = d.title(t, st);
  const desc = d.desc(t, st).slice(0, 160);
  const faq = d.faq(t, st);
  const hasMa = data.chart.some((r) => Number.isFinite(r.ma100));
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: d.h1(t, st),
        description: desc,
        datePublished: `${st.last.date}T07:00:00+09:00`,
        dateModified: `${data.today}T06:00:00+09:00`,
        inLanguage: lang,
        articleSection: d.section,
        keywords: L.keywords.join(", "),
        author: { "@type": "Organization", name: "NewsInsight" },
        publisher: { "@type": "Organization", name: "NewsInsight", url: SITE },
        mainEntityOfPage: url,
      },
      {
        "@type": "Dataset",
        name: `${L.name} daily close`,
        description: L.desc,
        url,
        temporalCoverage: `${st.periodStart}/${st.last.date}`,
        variableMeasured: lang === "ko" ? "종가" : "Daily close",
        creator: { "@type": "Organization", name: "NewsInsight", url: SITE },
        license: "https://creativecommons.org/licenses/by/4.0/",
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: d.crumbRoot, item: `${SITE}${d.base}` },
          { "@type": "ListItem", position: 2, name: L.name, item: url },
        ],
      },
    ],
  };
  const otherTopics = MARKET_TOPICS.filter((o) => o.slug !== t.slug && others.some((x) => x.slug === o.slug));
  const briefingHref = b ? `${b.hasEn || lang === "ko" ? d.briefingBase : "/briefing"}/${b.day}` : d.briefingBase;

  return (
    <div style={box} lang={lang}>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} key="desc" />
        <meta property="og:title" content={title} key="og-title" />
        <meta property="og:description" content={desc} key="og-desc" />
        <meta property="og:url" content={url} key="og-url" />
        <meta property="og:type" content="article" key="og-type" />
        <meta property="og:locale" content={d.ogLocale} key="og-locale" />
        <link rel="canonical" href={url} key="canonical" />
        <AlternateLinks koPath={`/market/${t.slug}`} enPath={`/en/market/${t.slug}`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(jsonLd) }} />
      </Head>

      <p style={{ color: "#999", fontSize: 13, margin: "8px 0 4px", display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <span>
          <Link href={d.base} style={{ color: "#00ffcc" }}>{d.crumbRoot}</Link> › {L.name}
        </span>
        <Link href={`${lang === "ko" ? "/en/market" : "/market"}/${t.slug}`} hrefLang={lang === "ko" ? "en" : "ko"} style={{ color: "#9bd" }}>
          {d.enCta}
        </Link>
      </p>
      <h1 style={{ color: "#00bfff", fontSize: 24, lineHeight: 1.35, marginTop: 4 }}>{d.h1(t, st)}</h1>
      <p style={{ color: "#999", fontSize: 12, margin: "0 0 12px" }}>{d.dataLine(st, t)}</p>
      {st.stale && (
        <p style={{ color: "#ffd166", fontSize: 13, border: "1px solid rgba(255,209,102,0.4)", borderRadius: 8, padding: "8px 12px" }}>{d.stale(st)}</p>
      )}
      <p style={{ fontSize: 16, lineHeight: 1.85, color: "#ddd" }}>{d.summary(t, st)}</p>

      <section style={card}>
        <h2 style={h2}>{d.tableTitle}</h2>
        <FiguresTable t={t} st={st} d={d} />
        <p style={{ color: "#777", fontSize: 12, margin: "10px 0 0" }}>
          {t.kind === "rate" ? d.noteRate : null} {t.computed ? d.noteCross : null}
        </p>
      </section>

      <section style={card}>
        <h2 style={h2}>{d.chartTitle}</h2>
        <LineChart rows={data.chart} dec={t.dec} kind={t.kind} aria={d.chartAria(t, st)} />
        <p style={{ color: "#777", fontSize: 12, margin: "8px 0 0" }}>{d.chartLegend(hasMa)}</p>
      </section>

      <section style={card}>
        <h2 style={h2}>{d.newsTitle}</h2>
        {b ? (
          <>
            <p style={{ color: "#999", fontSize: 12, margin: "0 0 8px" }}>{d.newsFrom(b)}</p>
            {b.sectionBody && (
              <>
                {b.sectionHeading && <h3 style={{ fontSize: 15, color: "#ddd", margin: "0 0 6px" }}>{b.sectionHeading}</h3>}
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.85, fontSize: 15 }}>{b.sectionBody}</div>
              </>
            )}
            {b.news_items?.length > 0 && (
              <ol style={{ margin: "10px 0 8px", paddingLeft: 20, lineHeight: 1.8, fontSize: 14 }}>
                {b.news_items.map((n, i) => (
                  <li key={i}>
                    {n.category ? <span style={{ color: "#999" }}>[{n.category}] </span> : null}
                    {n.title}
                  </li>
                ))}
              </ol>
            )}
            <Link href={briefingHref} style={{ color: "#00bfff", fontSize: 13 }}>{d.newsLink(b)}</Link>
          </>
        ) : (
          <p style={{ color: "#888", fontSize: 14 }}>{d.newsNone}</p>
        )}
      </section>

      <section style={card}>
        <h2 style={h2}>{d.faqTitle}</h2>
        {faq.map((f) => (
          <div key={f.q} style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, color: "#ddd", margin: "0 0 4px" }}>{f.q}</h3>
            <p style={{ margin: 0, lineHeight: 1.8, fontSize: 14, color: "#ccc" }}>{f.a}</p>
          </div>
        ))}
      </section>

      <nav style={{ ...card, paddingBottom: 12 }}>
        <h2 style={{ ...h2, fontSize: 16 }}>{d.othersTitle}</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {otherTopics.map((o) => {
            const ov = others.find((x) => x.slug === o.slug);
            return (
              <Link
                key={o.slug}
                href={`${d.base}/${o.slug}`}
                style={{ color: "#9bd", fontSize: 13, textDecoration: "none", border: "1px solid var(--line)", borderRadius: 6, padding: "4px 8px" }}
              >
                {o[lang].name}
                {ov ? <span style={{ color: color(ov.delta), marginLeft: 6 }}>{fmtNum(ov.close, o.dec)} {fmtDelta(ov.delta, o.kind)}</span> : null}
              </Link>
            );
          })}
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 14 }}>
          <Link href={d.briefingBase} style={{ color: "#00ffcc" }}>{d.briefingCta}</Link>
        </p>
      </nav>

      <p style={{ color: "#777", fontSize: 12, lineHeight: 1.7 }}>{d.disclaimer}</p>
    </div>
  );
}

// 목록 페이지(ko/en 공용)
export function MarketIndexPage({ lang, overview }) {
  const d = DICT[lang];
  const url = `${SITE}${d.base}`;
  const title = lang === "ko"
    ? "시세 — 달러 환율·엔화 환율·미국 금리·코스피200·나스닥100·금 시세 매일 종가 | NewsInsight"
    : "Markets — USD/KRW, JPY/KRW, US 10Y yield, KOSPI 200, Nasdaq 100, gold daily close | NewsInsight";
  const desc = lang === "ko"
    ? "달러/원·엔/원·달러/엔 환율, 달러인덱스, 미국 10년물·한국 3년물 금리, 코스피200·나스닥100·닛케이225·항셍·DAX, 금·WTI·천연가스의 최근 종가와 전일·1주·1개월 변화, 100일 이동평균 대비 위치를 매일 정리합니다."
    : "Daily close, day/week/month change and 100-day average position for USD/KRW, JPY/KRW, USD/JPY, the dollar index, US and Korean yields, KOSPI 200, Nasdaq 100, Nikkei 225, Hang Seng, DAX, gold, WTI and natural gas.";
  const groups = lang === "ko"
    ? [["환율", "currency"], ["금리", "treasury"], ["주가지수", "index"], ["원자재", "commodity"]]
    : [["Currencies", "currency"], ["Rates", "treasury"], ["Equity indices", "index"], ["Commodities", "commodity"]];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description: desc,
    url,
    inLanguage: lang,
    hasPart: MARKET_TOPICS.filter((t) => overview.some((o) => o.slug === t.slug)).map((t) => ({ "@type": "WebPage", name: t[lang].name, url: `${url}/${t.slug}` })),
  };
  return (
    <div style={box} lang={lang}>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} key="desc" />
        <meta property="og:title" content={title} key="og-title" />
        <meta property="og:description" content={desc} key="og-desc" />
        <meta property="og:url" content={url} key="og-url" />
        <meta property="og:locale" content={d.ogLocale} key="og-locale" />
        <link rel="canonical" href={url} key="canonical" />
        <AlternateLinks koPath="/market" enPath="/en/market" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(jsonLd) }} />
      </Head>
      <p style={{ color: "#999", fontSize: 13, margin: "8px 0 4px", textAlign: "right" }}>
        <Link href={lang === "ko" ? "/en/market" : "/market"} style={{ color: "#9bd" }}>{d.enCta}</Link>
      </p>
      <h1 style={{ color: "#00bfff", fontSize: 24 }}>{lang === "ko" ? "시세 — 매일 종가와 추이" : "Markets — daily close and trend"}</h1>
      <p style={{ color: "#999", fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
      {!overview.length && <p style={{ color: "#888" }}>{lang === "ko" ? "시세 데이터를 불러오지 못했습니다." : "Market data could not be loaded."}</p>}
      {groups.map(([label, cat]) => {
        const items = MARKET_TOPICS.filter((t) => t.cat === cat && overview.some((o) => o.slug === t.slug));
        if (!items.length) return null;
        return (
          <section key={cat} style={{ marginBottom: 18 }}>
            <h2 style={{ color: "#00ffcc", fontSize: 17, margin: "0 0 8px" }}>{label}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
              {items.map((t) => {
                const o = overview.find((x) => x.slug === t.slug);
                return (
                  <Link key={t.slug} href={`${d.base}/${t.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <article style={{ background: "var(--panel-2)", borderRadius: 10, padding: "12px 14px", height: "100%" }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#eee" }}>{t[lang].name}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "4px 0 2px" }}>{d.val(o.close, t)}</div>
                      <div style={{ fontSize: 13, color: color(o.delta) }}>
                        {fmtDelta(o.delta, t.kind)} <span style={{ color: "#777" }}>· {o.date}{o.stale ? (lang === "ko" ? " · 데이터 지연" : " · delayed") : ""}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#999", marginTop: 6, lineHeight: 1.5 }}>{t[lang].desc}</div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
      <p style={{ fontSize: 14 }}>
        <Link href={d.briefingBase} style={{ color: "#00ffcc" }}>{d.briefingCta}</Link>
      </p>
      <p style={{ color: "#777", fontSize: 12, lineHeight: 1.7 }}>{d.disclaimer}</p>
    </div>
  );
}

export { DICT as MARKET_DICT, fmtDelta };
