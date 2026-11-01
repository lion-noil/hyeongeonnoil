// 전략 카드 — 전략 / 그래프 / 성과 세 덩어리만 보이게. (2026-11-01, 사용자: "전략 딱, 그래프 딱, 성과 딱")
// 그래프·성과는 QuantConnect 재현 결과(qc_backtest_*.json)를 쓰고, 자체 엔진 10년 기록·거래 목록·주의문은 '자세히' 안에 접어 둔다.
import React, { useState } from "react";
import Panel, { Chip } from "./ui/Panel";
import QcBacktestView from "./QcBacktestView";
import KospiStrategyView from "./KospiStrategyView";

const fmtPct = (v, d = 1) => (v == null ? "—" : `${v > 0 ? "+" : ""}${Number(v).toFixed(d)}%`);
const tone = (v) => (v > 0 ? "var(--up)" : v < 0 ? "var(--down)" : "var(--text)");

function Tile({ label, value, sub, color }) {
  return (
    <div className="inset" style={{ padding: "12px 14px", minWidth: 0 }}>
      <div className="meta" style={{ marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: color || "var(--text)", lineHeight: 1.1 }}>{value}</div>
      {sub && <div className="meta" style={{ marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function StrategyRecord({ kpg, qc, meta, side = "숏 · 하루 1회", market }) {
  const [more, setMore] = useState(false);
  const s = qc.stats || {}; const tw = qc.three_way || {}; const q = tw.qc || {};
  const rs = (qc.qc_trades || []).map((t) => t.r);
  const g = rs.filter((x) => x > 0).reduce((a, b) => a + b, 0); const L = -rs.filter((x) => x < 0).reduce((a, b) => a + b, 0);
  const pf = L > 0 ? (g / L).toFixed(2) : (s.pl_ratio != null && s.win_rate_pct != null ? ((s.pl_ratio * s.win_rate_pct) / Math.max(1, 100 - s.win_rate_pct)).toFixed(2) : "—");
  const eng = tw.engine || {};
  const cell = (qc.cell_rows || [])[0] || {};
  const nTrades = q.n ?? s.closed_trades; const perTrade = q.mean ?? cell.qc_avg;
  const years = qc.meta?.start && qc.meta?.end ? Math.max(1, (new Date(qc.meta.end) - new Date(qc.meta.start)) / 3.156e10) : 5;
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* 전략 */}
      <Panel icon="📐" title="전략" meta={market || kpg?.market} hover={false}
        badge={<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><Chip color="var(--warn)">{side}</Chip><Chip color="var(--cyan)">{qc.meta?.start} ~ {qc.meta?.end}</Chip></div>}>
        {kpg ? (
          <>
            <ol style={{ margin: 0, paddingLeft: 22, display: "grid", gap: 4 }}>
              {kpg.rules.map((r) => (
                <li key={r.no} style={{ lineHeight: 1.7, fontSize: "var(--fs-md)", color: "var(--text-2)" }}>
                  <b style={{ color: "var(--text)" }}>{r.name}</b> — {r.text}
                </li>
              ))}
            </ol>
            <p style={{ margin: "8px 0 0", lineHeight: 1.7, fontSize: "var(--fs-md)", color: "var(--text-2)" }}><b style={{ color: "var(--text)" }}>청산</b> — {kpg.exit}</p>
          </>
        ) : (
          <p style={{ margin: 0, lineHeight: 1.7, fontSize: "var(--fs-md)", color: "var(--text-2)" }}>{meta?.how}</p>
        )}
      </Panel>

      {/* 그래프 — QuantConnect 자본곡선 */}
      <QcBacktestView data={qc} currency="KRW" chartOnly />

      {/* 성과 */}
      <Panel icon="📊" title="성과 — QuantConnect 재현" meta={`${qc.meta?.engine} · 수수료 왕복 0.02%`} hover={false}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
          <Tile label="거래" value={`${nTrades}건`} sub={`${qc.meta?.start?.slice(0, 4)}~${qc.meta?.end?.slice(0, 4)} · 연 ${(nTrades / years).toFixed(0)}건`} />
          <Tile label="건당 수익" value={fmtPct(perTrade, 2)} sub={kpg ? "수수료 후" : "수수료 전"} color={tone(perTrade)} />
          <Tile label="승률" value={`${Math.round(s.win_rate_pct)}%`} />
          <Tile label="총이익 ÷ 총손실" value={`${pf}배`} />
          <Tile label="순이익" value={fmtPct(s.net_profit_pct, 1)} sub={kpg ? "평가액 전부 투입, 복리" : "1,000만 원 시작, 복리"} color={tone(s.net_profit_pct)} />
          <Tile label="최대 낙폭" value={`−${Number(s.max_dd_pct).toFixed(1)}%`} color="var(--down)" />
        </div>
        <p className="meta" style={{ margin: "10px 0 0", lineHeight: 1.6 }}>
          {kpg ? (
            <>같은 규칙을 자체 엔진으로 돌리면 같은 기간 {eng.n}건 · 건당 {fmtPct(eng.mean, 2)}, 10년 전체는 {kpg.stats_10y.n}건 · 건당 {fmtPct(kpg.stats_10y.exp_pct, 2)} · 총 {fmtPct(kpg.stats_10y.total_pct)}.
              {" "}데이터는 크레온 1분봉(자체 수집)이라 외부 데이터 검증은 아직 없고, 실거래 기록도 없습니다.</>
          ) : (
            <>{meta?.cell_match}. {meta?.account_note}</>
          )}
          {" "}<button type="button" className="chip" onClick={() => setMore((v) => !v)} style={{ cursor: "pointer", font: "inherit", fontSize: "var(--fs-xs)", fontWeight: 700 }}>{more ? "접기" : (kpg ? "자세히 (10년 기록 · 거래 목록 · 주의문)" : "자세히 (월별 · 셀 대조 · 주의문)")}</button>
        </p>
      </Panel>

      {more && (
        <div style={{ display: "grid", gap: 14 }}>
          {kpg && <KospiStrategyView data={kpg} />}
          <QcBacktestView data={qc} caveats={meta?.caveats || []} expectation={meta?.expectation || ""} currency="KRW" feeNote={meta?.fee_note} />
        </div>
      )}
    </div>
  );
}
