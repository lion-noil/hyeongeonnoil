// 코스피200 ETF 전용 책 검증 기록 뷰 — /verified 코스피200 탭 (2026-11-02)
// 데이터: src/data/kospi_etf_book.json (reversion_research/backtests/build_etf_book_site.py)
// 신호는 선물 카드들과 같고 체결가만 ETF 실제 시세로 재산정. 구성: 왜 나누나 → 전략 4개 표 → 누적 차트 → 공통 규칙·비용 → 주의문 → 거래 목록(접기)
import React, { useState } from "react";
import Panel, { Chip } from "./ui/Panel";

const p = { lineHeight: 1.8, fontSize: "var(--fs-md)", margin: "0 0 10px", color: "var(--text-2)" };
const fmtPct = (v, d = 1) => (v == null ? "—" : `${v > 0 ? "+" : ""}${Number(v).toFixed(d)}%`);
const th = { textAlign: "right", padding: "6px 8px", fontSize: "var(--fs-xs)", color: "var(--muted)", fontWeight: 700, whiteSpace: "nowrap", borderBottom: "1px solid var(--line)" };
const td = { textAlign: "right", padding: "6px 8px", fontSize: "var(--fs-sm)", color: "var(--text)", whiteSpace: "nowrap", borderBottom: "1px solid var(--line)" };
const tdl = { ...td, textAlign: "left", whiteSpace: "normal", minWidth: 220, lineHeight: 1.6 };
const tone = (v) => (v > 0 ? "var(--up)" : v < 0 ? "var(--down)" : "var(--text)");

export default function EtfBookView({ data }) {
  const [open, setOpen] = useState(null);
  const S = data.strategies || []; const b = data.book || {};
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Panel icon="🧭" title="왜 따로 두나" meta={`실계좌 가동 ${data.live_since}~`} hover={false}
        badge={<Chip color="var(--warn)">ETF 4전략 · 동시 보유 1개</Chip>}>
        <p style={p}>{data.why}</p>
        <p style={{ ...p, margin: 0 }}>{data.rules_common} {data.account_note}.</p>
      </Panel>

      <Panel icon="📐" title="전략 4개 — ETF 집행 규칙과 재산정 결과" meta="비용 후, 단순 합" hover={false}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: "left" }}>전략</th><th style={{ ...th, textAlign: "left" }}>종목 · 진입 → 청산</th>
                <th style={th}>기간</th><th style={th}>건수</th><th style={th}>건당</th><th style={th}>승률</th><th style={th}>총이익÷총손실</th><th style={th}>합계</th><th style={th}>최대 낙폭</th>
              </tr>
            </thead>
            <tbody>
              {S.map((s) => (
                <tr key={s.id}>
                  <td style={{ ...td, textAlign: "left", fontWeight: 800 }}>{s.id} {s.name}<div className="meta">{s.side}</div></td>
                  <td style={tdl}><b>{s.etf}</b><br />{s.entry} → {s.exit}<div className="meta" style={{ marginTop: 4 }}>선물판: {s.futures}</div></td>
                  <td style={td}>{s.period}</td>
                  <td style={td}>{s.n}건</td>
                  <td style={{ ...td, color: tone(s.exp_pct), fontWeight: 700 }}>{fmtPct(s.exp_pct, 2)}</td>
                  <td style={td}>{s.win_rate}%</td>
                  <td style={td}>{s.pf ?? "—"}배</td>
                  <td style={{ ...td, color: tone(s.total_pct) }}>{fmtPct(s.total_pct)}</td>
                  <td style={td}>−{s.mdd_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="meta" style={{ margin: "10px 0 0", lineHeight: 1.6 }}>
          네 전략 합산({b.window}): {b.n}건 · 연 {b.per_year}건 · 합계 {fmtPct(b.total_pct)} · 최대 낙폭 −{b.mdd_pct}%.
          {" "}연도별 {(b.yearly || []).map((y) => `${y.year} ${fmtPct(y.ret_pct)}`).join(" / ")}. 비용: {data.costs}. {data.not_used}
        </p>
      </Panel>

      <Panel icon="📈" title="전략별 누적 수익" meta="ETF 실제 시세 재산정 · 비용 후" hover={false} pad={0}>
        <img src={`/verified/kospi-etf-book.png?v=${data.updated}-${b.n}`} alt="ETF 전용 책 전략별 누적 수익" style={{ width: "100%", display: "block", borderRadius: "0 0 var(--radius) var(--radius)" }} loading="lazy" />
      </Panel>

      <Panel icon="⚠️" title="주의" meta={`${(data.caveats || []).length}가지`} hover={false}>
        <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
          {(data.caveats || []).map((c, i) => <li key={i} style={{ lineHeight: 1.7, fontSize: "var(--fs-sm)", color: "var(--text-2)" }}>{c}</li>)}
        </ul>
      </Panel>

      <Panel icon="🧾" title="거래 목록" meta="전략을 누르면 펼침" hover={false}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: open ? 10 : 0 }}>
          {S.map((s) => (
            <button key={s.id} type="button" className="chip" onClick={() => setOpen(open === s.id ? null : s.id)} style={{ cursor: "pointer", font: "inherit", fontSize: "var(--fs-xs)", fontWeight: 700 }}>
              {open === s.id ? "접기 · " : ""}{s.id} {s.name} ({s.n})
            </button>
          ))}
        </div>
        {open && (
          <div style={{ overflowX: "auto", maxHeight: 420 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={{ ...th, textAlign: "left" }}>날짜</th><th style={th}>진입</th><th style={th}>청산</th><th style={th}>사유</th><th style={th}>시세</th><th style={th}>수익</th></tr></thead>
              <tbody>
                {(S.find((s) => s.id === open)?.trades || []).map((t, i) => (
                  <tr key={i}>
                    <td style={{ ...td, textAlign: "left" }}>{t.date}</td><td style={td}>{t.entry}</td><td style={td}>{t.exit}</td><td style={td}>{t.why}</td>
                    <td style={td}>{t.src}</td><td style={{ ...td, color: tone(t.ret_pct), fontWeight: 700 }}>{fmtPct(t.ret_pct, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
