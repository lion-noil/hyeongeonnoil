// src/components/home/GlobalBriefingCard.jsx
// 전일 글로벌 브리핑 — 각국 뉴스요약을 종합해 뽑은 핵심 뉴스 5개 (youtube_data.global_briefing).
// News_scrap 전일브리핑.py가 매일 06:55 persist 직후 발행. 없으면 렌더 안 함.
// 2026-10-25: 공용 <Panel> 로 통일(제목은 섹션 제목이 맡고 카드 헤더는 날짜·갱신 정보만).
import React from "react";
import Panel, { Chip, Rank, LiveBadge } from "../ui/Panel";
import { categoryColor, countryKo } from "../../lib/theme";

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

  // rolling=true: 낮 동안 갱신되는 "오늘 브리핑", 아니면 06:55 최종본(전일).
  const rolling = !!b?.rolling;
  const nIn = Array.isArray(b?.countries_in) ? b.countries_in.length : 0;
  const rel = relDay(b?.date);
  const when = fmtTime(b?.generated_at);
  const title = rolling ? "오늘 글로벌 브리핑" : "전일 글로벌 브리핑";
  const meta = b?.date
    ? [
        `${rel ? rel + " " : ""}${fmtDate(b.date)}`,
        rolling ? `지금까지 ${nIn || "각"}개국 보도 종합` : "각국 보도 종합",
        when ? `${when} ${rolling ? "갱신" : "생성"}` : null,
      ].filter(Boolean).join(" · ")
    : "각국 보도 종합";

  return (
    <Panel
      icon="📌"
      title={title}
      meta={meta}
      badge={<LiveBadge live liveText={`핵심 ${items.length}선`} />}
      style={{ maxWidth: 960, margin: "0 auto" }}
      pad={14}
    >
      {items.map((it, i) => {
        const cat = String(it.category || "");
        const countries = Array.isArray(it.countries) ? it.countries : [];
        return (
          <div key={i} className="brief-item inset">
            <Rank n={it.rank ?? i + 1} size={24} />
            <div style={{ minWidth: 0 }}>
              <div className="t">
                {it.title}
                {cat && <Chip color={categoryColor(cat)}>{cat}</Chip>}
              </div>
              {it.summary && <div className="s">{it.summary}</div>}
              {countries.length > 0 && (
                <div className="src meta">보도: {countries.map((c) => countryKo(c)).join(" · ")}</div>
              )}
            </div>
          </div>
        );
      })}
    </Panel>
  );
}
