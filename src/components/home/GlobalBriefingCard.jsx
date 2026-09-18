// src/components/home/GlobalBriefingCard.jsx
// 전일 글로벌 브리핑 — 각국 뉴스요약을 종합해 뽑은 핵심 뉴스 5개 (youtube_data.global_briefing).
// News_scrap 전일브리핑.py가 매일 06:55 persist 직후 발행. 없으면 렌더 안 함.
import React from "react";

const CAT_COLOR = {
  "지정학": "#e8913a",
  "경제·시장": "#3a9bdc",
  "정치": "#c084fc",
  "산업·기술": "#2fe08d",
  "사회·기타": "#9aa0a6",
};

const COUNTRY_KO = {
  Korea: "한국", USA: "미국", Japan: "일본", China: "중국",
  Germany: "독일", UK: "영국", India: "인도", HongKong: "홍콩",
};

function fmtDate(d) {
  // "2026-07-07" → "7/7 (화)"
  try {
    const dt = new Date(`${d}T00:00:00+09:00`);
    const day = ["일", "월", "화", "수", "목", "금", "토"][dt.getDay()];
    return `${dt.getMonth() + 1}/${dt.getDate()} (${day})`;
  } catch {
    return d;
  }
}

// KST 기준 오늘/어제 판정 — 브리핑 날짜를 "오늘 9/19 (금)" / "어제 9/18 (목)" 처럼 상대어로 (2026-09-19)
function kstDateStr(offsetDays = 0) {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  now.setDate(now.getDate() + offsetDays);
  const p = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

function relDay(d) {
  if (!d) return "";
  if (d === kstDateStr(0)) return "오늘";
  if (d === kstDateStr(-1)) return "어제";
  return "";
}

function fmtTime(iso) {
  // "2026-09-19T16:30:12+09:00" → "16:30"
  try {
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" });
  } catch {
    return "";
  }
}

export default function GlobalBriefingCard({ briefing }) {
  // /youtube 패스스루가 파싱된 객체를 주지만, 문자열로 올 가능성도 방어
  let b = briefing;
  if (typeof b === "string") {
    try { b = JSON.parse(b); } catch { return null; }
  }
  const items = Array.isArray(b?.items) ? b.items : [];
  if (!items.length) return null;

  // rolling=true: News_scrap 전일브리핑.generate_and_store_rolling_briefing 이 낮 동안 갱신하는 "오늘 브리핑".
  // 아니면 06:55 최종본(전일). 라벨은 KST 기준 오늘/어제 상대어 + 날짜 + 갱신(생성) 시각.
  const rolling = !!b?.rolling;
  const nIn = Array.isArray(b?.countries_in) ? b.countries_in.length : 0;
  const rel = relDay(b?.date);
  const when = fmtTime(b?.generated_at);
  const title = rolling ? "📌 오늘 글로벌 브리핑" : "📌 전일 글로벌 브리핑";
  const subtitle = b?.date
    ? [
        `${rel ? rel + " " : ""}${fmtDate(b.date)}`,
        rolling ? `지금까지 ${nIn || "각"}개국 보도 종합` : "각국 보도 종합",
        when ? `${when} ${rolling ? "갱신" : "생성"}` : null,
        `핵심 ${items.length}선`,
      ].filter(Boolean).join(" · ")
    : "각국 보도 종합";

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto 24px",
        padding: "16px 18px",
        borderRadius: 14,
        background: "#111823",
        border: "1px solid #1f2c3f",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ fontSize: 17, fontWeight: 900, color: "#e8f1ff" }}>
          {title}
        </div>
        <div style={{ fontSize: 12.5, color: "#7d93b2" }}>
          {subtitle}
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((it, i) => {
          const cat = String(it.category || "");
          const catColor = CAT_COLOR[cat] || "#9aa0a6";
          const countries = Array.isArray(it.countries) ? it.countries : [];
          return (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div
                style={{
                  flex: "0 0 auto",
                  width: 22, height: 22, borderRadius: 999,
                  background: "#1c2a3f", color: "#7fb3e8",
                  fontSize: 12, fontWeight: 900,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginTop: 1,
                }}
              >
                {it.rank ?? i + 1}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "#e6edf6", lineHeight: 1.4 }}>
                  {it.title}
                  {cat && (
                    <span
                      style={{
                        marginLeft: 8, fontSize: 10, fontWeight: 800,
                        color: catColor, border: `1px solid ${catColor}55`,
                        borderRadius: 999, padding: "1px 7px",
                        verticalAlign: "middle", whiteSpace: "nowrap",
                      }}
                    >
                      {cat}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12.5, color: "#aebdd0", lineHeight: 1.55, marginTop: 3 }}>
                  {it.summary}
                </div>
                {countries.length > 0 && (
                  <div style={{ fontSize: 10.5, color: "#66788f", marginTop: 4 }}>
                    보도: {countries.map((c) => COUNTRY_KO[c] || c).join(" · ")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
