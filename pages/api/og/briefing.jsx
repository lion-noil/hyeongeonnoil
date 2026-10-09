// 시장 브리핑 OG 이미지 — /api/og/briefing?day=YYYY-MM-DD&lang=ko|en → 1200×630 PNG. (2026-10-09)
// 내용: 브랜드 줄·날짜·브리핑 제목(2줄)·핵심 시세 6칸(달러/원·미10년물·코스피200·나스닥100·금·BTC, 상승 빨강·하락 파랑).
// 데이터: Upstash market_briefings (briefingDb.getBriefing). day 가 없거나 데이터 없음·렌더 실패 → og-default.png 폴백.
// 캐시: public, max-age=3600, s-maxage=86400 (브리핑은 하루 1편이라 day 별 URL 이 곧 버전).
export const config = { runtime: "edge" };

import { ImageResponse } from "next/og";
import { getBriefing } from "../../../src/lib/briefingDb";
import { SNAPSHOT_LABEL_EN } from "../../../src/lib/marketTopics";
import { OG_W, OG_H, C, Frame, toPngResponse, originOf, loadFonts, fallbackResponse, fmtNum, signed, colorOf, arrowOf, fmtDate } from "../../../src/lib/ogImage";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const PREFERRED = ["usd_krw", "us-t10", "kospi200", "nasdaq100", "gold", "btcusdt"];
const TILES = 6;

// 선호 순서대로 6개, 없으면 snapshot 순서로 채움
function pickTiles(snapshot) {
  const list = Array.isArray(snapshot) ? snapshot.filter((s) => s && s.key && s.close != null) : [];
  const byKey = new Map(list.map((s) => [s.key, s]));
  const out = [];
  for (const k of PREFERRED) if (byKey.has(k) && out.length < TILES) out.push(byKey.get(k));
  for (const s of list) if (out.length < TILES && !out.includes(s)) out.push(s);
  return out;
}

// 값과 단위를 분리 — 단위는 작게, 합쳐서 길면 값 글자를 줄여 168px 타일 안에 들어가게 한다
function tileValue(s, lang) {
  const isRate = s.unit === "%";
  if (isRate) return { value: `${fmtNum(s.close, 3)}%`, unit: "" };
  const dec = Number.isFinite(Number(s.dec)) ? Number(s.dec) : 2;
  const unit = String(s.unit || "");
  // 영문은 한글 단위 생략, 달러·퍼센트 같은 기호만 유지
  const showUnit = lang === "en" ? (/^[A-Za-z$€¥£%]+$/.test(unit) ? unit : "") : unit;
  return { value: fmtNum(s.close, dec), unit: showUnit };
}
function tileLabel(s, lang) {
  const raw = lang === "en" ? SNAPSHOT_LABEL_EN[s.key] || s.label || s.key : s.label || s.key;
  const l = String(raw);
  return l.length > 11 ? l.replace(/\s*\(.*\)\s*$/, "") : l; // "비트코인(BTC/USDT)" → "비트코인"
}
function tileDelta(s) {
  const isRate = s.unit === "%";
  if (isRate) return { text: `${signed(s.chg_bp, 1)}bp`, v: s.chg_bp };
  return { text: `${signed(s.pct, 2)}%`, v: s.pct };
}

export default async function handler(req) {
  const origin = originOf(req);
  const { searchParams } = new URL(req.url);
  const day = String(searchParams.get("day") || "");
  const lang = searchParams.get("lang") === "en" ? "en" : "ko";
  if (!DAY_RE.test(day)) return fallbackResponse(origin);

  let b = null;
  try {
    b = await getBriefing(day);
  } catch {
    b = null;
  }
  if (!b || !b.title) return fallbackResponse(origin);

  const hasEn = !!(b.en && typeof b.en === "object" && b.en.title);
  const title = lang === "en" && hasEn ? b.en.title : b.title;
  const tiles = pickTiles(b.snapshot);
  const kicker = lang === "en" ? "NewsInsight · Korea Market Briefing" : "NewsInsight · 시장 브리핑";
  const basis = b.data_date ? (lang === "en" ? `Closes as of ${b.data_date}` : `${b.data_date} 종가 기준`) : "";
  const titleSize = String(title).length <= 34 ? 52 : 46; // 짧은 제목은 키워 빈 공간을 줄임

  try {
    const fonts = await loadFonts(origin);
    const img = new ImageResponse(
      (
        <Frame kicker={kicker} right={fmtDate(day, lang)} footerRight={basis}>
          <div
            style={{
              display: "flex",
              fontSize: tiles.length ? titleSize : 54,
              lineHeight: 1.3,
              fontWeight: 700,
              color: C.text,
              // 2줄 높이 + 디센더 여유. 이전 124px 는 두 번째 줄 아랫부분이 잘렸다.
              maxHeight: tiles.length ? titleSize * 1.3 * 2 + 14 : 230,
              overflow: "hidden",
              lineClamp: tiles.length ? 2 : 3,
              textOverflow: "ellipsis",
              letterSpacing: -0.5,
              wordBreak: "keep-all", // 한글 단어 중간("브/리핑") 줄바꿈 방지
            }}
          >
            {title}
          </div>
          {tiles.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {tiles.map((s) => {
                const d = tileDelta(s);
                const label = tileLabel(s, lang);
                const tv = tileValue(s, lang);
                const valueSize = tv.value.length + tv.unit.length > 9 ? 23 : 27;
                return (
                  <div
                    key={s.key}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      width: 168,
                      padding: "16px 16px 14px",
                      borderRadius: 14,
                      background: C.panel,
                      border: `1px solid ${C.line}`,
                    }}
                  >
                    <span style={{ fontSize: 18, color: C.dim, whiteSpace: "nowrap", overflow: "hidden" }}>{label}</span>
                    <div style={{ display: "flex", alignItems: "baseline", marginTop: 6, whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: valueSize, fontWeight: 700, color: C.text }}>{tv.value}</span>
                      {tv.unit ? <span style={{ fontSize: 15, color: C.sub, marginLeft: 3 }}>{tv.unit}</span> : null}
                    </div>
                    <span style={{ fontSize: 21, fontWeight: 700, color: colorOf(d.v), marginTop: 4, whiteSpace: "nowrap" }}>
                      {arrowOf(d.v)} {d.text}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
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
