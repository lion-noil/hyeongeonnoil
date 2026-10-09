// 시세 페이지 OG 이미지 — /api/og/market?slug=usd-krw&lang=ko|en → 1200×630 PNG. (2026-10-09)
// 내용: 토픽 이름·최근 종가·전일 변화·1주/1개월 변화·100일 평균 대비 + 최근 90거래일 미니 라인 차트(SVG path).
// 데이터: marketDataDb.getTopicData (Upstash chart_data). slug 없음·데이터 없음·렌더 실패 → og-default.png 폴백.
// 페이지의 og:image URL 에는 &v=마지막종가일 을 붙여 종가가 바뀌면 새 이미지로 캐시가 갈린다.
export const config = { runtime: "edge" };

import { ImageResponse } from "next/og";
import { getTopicData } from "../../../src/lib/marketDataDb";
import { TOPIC_BY_SLUG } from "../../../src/lib/marketTopics";
import { OG_W, OG_H, C, Frame, toPngResponse, originOf, loadFonts, fallbackResponse, fmtNum, colorOf, arrowOf, fmtDate } from "../../../src/lib/ogImage";

const CW = 560; // 차트 폭
const CH = 300; // 차트 높이
const PAD = 10;

function fmtDelta(delta, kind, dec = 2) {
  if (delta == null || !Number.isFinite(Number(delta))) return "-";
  const n = Number(delta);
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return kind === "rate" ? `${sign}${Math.abs(n).toFixed(1)}bp` : `${sign}${Math.abs(n).toFixed(dec)}%`;
}

function unitFor(t, lang) {
  if (t.kind === "rate") return "%";
  const u = lang === "en" ? t.en.unit : t.ko.unit;
  if (!u) return "";
  return lang === "en" ? ` ${u}` : u.split("/")[0]; // ko: "달러/온스" → "달러", en: " USD/oz"
}

// 종가 시리즈 → SVG path (라인·면적). 값이 1개면 평평한 선.
function buildChart(rows) {
  const xs = rows.map((r) => Number(r.close)).filter(Number.isFinite);
  if (!xs.length) return null;
  let lo = Math.min(...xs);
  let hi = Math.max(...xs);
  if (hi === lo) {
    hi += 1;
    lo -= 1;
  }
  const span = hi - lo;
  const n = xs.length;
  const px = (i) => PAD + (n === 1 ? (CW - 2 * PAD) / 2 : (i / (n - 1)) * (CW - 2 * PAD));
  const py = (v) => PAD + (1 - (v - lo) / span) * (CH - 2 * PAD);
  const pts = xs.map((v, i) => [px(i), py(v)]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${(CH - PAD).toFixed(1)} L${pts[0][0].toFixed(1)} ${(CH - PAD).toFixed(1)} Z`;
  const iHi = xs.indexOf(Math.max(...xs));
  const iLo = xs.indexOf(Math.min(...xs));
  return { line, area, last: pts[pts.length - 1], hi: { v: xs[iHi], p: pts[iHi] }, lo: { v: xs[iLo], p: pts[iLo] }, up: xs[xs.length - 1] >= xs[0] };
}

export default async function handler(req) {
  const origin = originOf(req);
  const { searchParams } = new URL(req.url);
  const slug = String(searchParams.get("slug") || "");
  const lang = searchParams.get("lang") === "en" ? "en" : "ko";
  const t = TOPIC_BY_SLUG[slug];
  if (!t) return fallbackResponse(origin);

  let data = null;
  try {
    data = await getTopicData(slug);
  } catch {
    data = null;
  }
  if (!data || !data.stats) return fallbackResponse(origin);

  const st = data.stats;
  const L = t[lang];
  const unit = unitFor(t, lang);
  const chart = buildChart(data.chart || []);
  const stroke = chart && chart.up ? C.up : C.down;
  const kicker = lang === "en" ? "NewsInsight · Markets" : "NewsInsight · 시세";
  const lbl = lang === "en"
    ? { prev: "Day", week: "1 week", month: "1 month", ma: st.ma.isPeriodAvg ? "vs period avg" : "vs 100-day avg", close: "Close", chart: `Last ${(data.chart || []).length} sessions` }
    : { prev: "전일", week: "1주", month: "1개월", ma: st.ma.isPeriodAvg ? "기간 평균 대비" : "100일 평균 대비", close: "종가", chart: `최근 ${(data.chart || []).length}거래일` };
  const nameSize = String(L.name).length > 18 ? 32 : 40; // "US 10-Year Treasury Yield" 같은 긴 이름은 한 줄에
  const rows = [
    [lbl.week, st.week ? st.week.delta : null],
    [lbl.month, st.month ? st.month.delta : null],
    [lbl.ma, st.ma ? st.ma.delta : null],
  ];

  try {
    const fonts = await loadFonts(origin);
    const img = new ImageResponse(
      (
        <Frame kicker={kicker} right={`${lbl.close} · ${fmtDate(st.last.date, lang)}`} footerRight={lang === "en" ? "Daily close · Updated every morning" : "매일 아침 종가 갱신"}>
          <div style={{ display: "flex", flex: 1, alignItems: "stretch" }}>
            {/* 왼쪽: 이름·종가·변화 */}
            <div style={{ display: "flex", flexDirection: "column", width: 480, paddingRight: 24, justifyContent: "center" }}>
              <div style={{ display: "flex", fontSize: nameSize, fontWeight: 700, lineHeight: 1.25, color: C.text, maxHeight: nameSize * 1.25 * 2 + 12, overflow: "hidden", lineClamp: 2, letterSpacing: -0.5, wordBreak: "keep-all" }}>{L.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", marginTop: 14 }}>
                <span style={{ fontSize: 66, fontWeight: 700, color: C.text, letterSpacing: -1 }}>{fmtNum(st.last.close, t.dec)}</span>
                <span style={{ fontSize: 26, color: C.sub, marginLeft: 8 }}>{unit}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", marginTop: 4, fontSize: 30, fontWeight: 700, color: colorOf(st.prev ? st.prev.delta : 0) }}>
                <span>{arrowOf(st.prev ? st.prev.delta : 0)}</span>
                <span style={{ marginLeft: 8 }}>{fmtDelta(st.prev ? st.prev.delta : null, t.kind)}</span>
                <span style={{ fontSize: 22, color: C.dim, fontWeight: 400, marginLeft: 12 }}>{lbl.prev}</span>
              </div>
              <div style={{ display: "flex", marginTop: 22 }}>
                {rows.map(([k, v]) => (
                  <div key={k} style={{ display: "flex", flexDirection: "column", marginRight: 22, padding: "10px 14px", borderRadius: 12, background: C.panel, border: `1px solid ${C.line}` }}>
                    <span style={{ fontSize: 17, color: C.dim, whiteSpace: "nowrap" }}>{k}</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: colorOf(v), marginTop: 2, whiteSpace: "nowrap" }}>{fmtDelta(v, t.kind)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 오른쪽: 90일 라인 차트 */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, color: C.dim, marginBottom: 6, padding: "0 4px" }}>
                <span>{lbl.chart}</span>
                <span>
                  {lang === "en" ? "High" : "최고"} {fmtNum(chart ? chart.hi.v : null, t.dec)} · {lang === "en" ? "Low" : "최저"} {fmtNum(chart ? chart.lo.v : null, t.dec)}
                </span>
              </div>
              <div style={{ display: "flex", width: CW, height: CH, borderRadius: 14, background: C.panel, border: `1px solid ${C.line}` }}>
                {chart && (
                  <svg width={CW} height={CH} viewBox={`0 0 ${CW} ${CH}`} xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <line x1={PAD} y1={CH * 0.5} x2={CW - PAD} y2={CH * 0.5} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                    <path d={chart.area} fill="url(#g)" />
                    <path d={chart.line} fill="none" stroke={stroke} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
                    <circle cx={chart.last[0]} cy={chart.last[1]} r="7" fill={stroke} />
                    <circle cx={chart.last[0]} cy={chart.last[1]} r="13" fill="none" stroke={stroke} strokeWidth="2" opacity="0.6" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        </Frame>
      ),
      {
        width: OG_W,
        height: OG_H,
        fonts,
      },
    );
    return await toPngResponse(img);
  } catch {
    return fallbackResponse(origin);
  }
}
