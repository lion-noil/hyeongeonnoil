// 환율 검증 기록 뷰 — /verified 환율 탭 (2026-11-04). 전략 FX1 「연준 결정 뒤 달러 바스켓 5일」부터.
// 데이터: src/data/fx_fed_basket.json (reversion_research/backtests/build_fx_site.py)
// 원자재(CommodityBookView)와 같은 구성이되, 환율은 독립 검증 구간이 없고 '바스켓(6쌍 균등) vs GBPUSD 단독' 비교와 쌍별 교차 확인이 핵심이라
// 결과 카드가 바스켓 타일 + 바스켓/단독 두 줄 표 + 쌍별 표로 되어 있다. 거래 목록은 사건(결정일)마다 여섯 쌍 수익과 바스켓 수익을 한 줄로.
// 구성: 특징 → 전략마다(제목 → 규칙 표 → 직관 → 결과(바스켓/단독·쌍별) → 누적 차트·해별) → 공통 규칙·비용 → 버린 것 → 주의 → 거래 목록(접기)
import React, { useState } from "react";
import Panel, { Chip } from "./ui/Panel";
import SectionHead from "./ui/SectionHead";

const p = { lineHeight: 1.8, fontSize: "var(--fs-md)", margin: "0 0 10px", color: "var(--text-2)" };
const li = { lineHeight: 1.7, fontSize: "var(--fs-sm)", color: "var(--text-2)" };
const fmtPct = (v, d = 1) => (v == null ? "—" : `${v > 0 ? "+" : ""}${Number(v).toFixed(d)}%`);
const th = { textAlign: "right", padding: "6px 8px", fontSize: "var(--fs-xs)", color: "var(--muted)", fontWeight: 700, whiteSpace: "nowrap", borderBottom: "1px solid var(--line)" };
const td = { textAlign: "right", padding: "6px 8px", fontSize: "var(--fs-sm)", color: "var(--text)", whiteSpace: "nowrap", borderBottom: "1px solid var(--line)" };
const tone = (v) => (v > 0 ? "var(--up)" : v < 0 ? "var(--down)" : "var(--text)");
const TopLink = () => <a href="#v-toc" className="toc-top">목차 ↑</a>;
const PAIRS = ["GBPUSD", "EURUSD", "AUDUSD", "NZDUSD", "USDCAD", "USDCHF"];

function Tile({ label, value, sub, color }) {
  return (
    <div className="inset" style={{ padding: "12px 14px", minWidth: 0 }}>
      <div className="meta" style={{ marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: color || "var(--text)", lineHeight: 1.1 }}>{value}</div>
      {sub && <div className="meta" style={{ marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function StatsRow({ label, s, strong }) {
  return (
    <tr>
      <td style={{ ...td, textAlign: "left", fontWeight: 700, color: strong ? "var(--text)" : "var(--text-2)" }}>{label}</td>
      <td style={td}>{s.n}건 (연 {s.per_year})</td>
      <td style={{ ...td, color: tone(s.exp_pct), fontWeight: strong ? 700 : 400 }}>{fmtPct(s.exp_pct, 2)}</td>
      <td style={td}>{s.win_rate}%</td>
      <td style={td}>{s.t}</td>
      <td style={td}>{s.pf}배</td>
      <td style={{ ...td, color: tone(s.x5_pct) }}>{fmtPct(s.x5_pct, 2)}</td>
      <td style={{ ...td, color: tone(s.total_pct) }}>{fmtPct(s.total_pct, 1)}</td>
      <td style={{ ...td, color: tone(s.annual_pct) }}>{fmtPct(s.annual_pct, 2)}</td>
      <td style={td}>−{s.mdd_pct}%</td>
      <td style={td}>{s.worst_pct}%</td>
      <td style={td}>{s.pos_years}/{s.years}</td>
      <td style={td}>{s.half_a} · {s.half_b}</td>
    </tr>
  );
}

function Strategy({ s, data, n }) {
  const b = s.stats.basket; const g = s.stats.single;
  return (
    <>
      <SectionHead id={`${data.id_prefix}-${s.id.toLowerCase()}`} aside={<TopLink />} kicker={`${data.symbol} · STRATEGY ${s.id}`} title={`${n}. 전략 ${s.id} — 「${s.name}」`} desc={s.summary} />

      {/* 규칙 표 */}
      <Panel icon="📐" title="규칙" meta={`${s.side} · ${s.hold} · ${s.zone}`} hover={false}
        badge={<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><Chip color="var(--warn)">{data.badge}</Chip><Chip color="var(--cyan)">{b.period}</Chip></div>}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {s.rules.map((r) => (
                <tr key={r.no}>
                  <td style={{ ...td, textAlign: "left", fontWeight: 700, verticalAlign: "top", width: 96 }}>{r.no}. {r.name}</td>
                  <td style={{ ...td, textAlign: "left", whiteSpace: "normal", lineHeight: 1.7, color: "var(--text-2)" }}>{r.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* 직관 */}
      <Panel icon="💡" title="왜 달러가 강해지나 — 직관과 근거" meta="규칙을 만들 때 확인한 것" hover={false}>
        <p style={p}>{s.why}</p>
        <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
          {(s.evidence || []).map((e, i) => <li key={i} style={li}>{e}</li>)}
        </ul>
      </Panel>

      {/* 결과 — 바스켓 / GBPUSD 단독 */}
      <Panel icon="📊" title="결과 — 달러 바스켓과 GBPUSD 단독" meta={`${b.window} · 비용·스왑 후 · 명목 100% 기준 · 독립 검증 구간 없음`} hover={false}>
        <p style={p}>{s.compare_note}</p>
        <div className="meta" style={{ marginBottom: 6, fontWeight: 700 }}>달러 바스켓(6쌍 균등) — 권장</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 12 }}>
          <Tile label="거래 수(결정 횟수)" value={`${b.n}건`} sub={`연 ${b.per_year}건 · 승률 ${b.win_rate}%`} />
          <Tile label="건당 수익 (비용·스왑 후)" value={fmtPct(b.exp_pct, 2)} sub={`GBPUSD 단독 ${fmtPct(g.exp_pct, 2)} · t값 ${b.t}`} color={tone(b.exp_pct)} />
          <Tile label="큰 5건 뺀 건당" value={fmtPct(b.x5_pct, 2)} sub={`중앙값 ${fmtPct(b.median_pct, 2)}`} color={tone(b.x5_pct)} />
          <Tile label="1건 최악" value={`${b.worst_pct}%`} sub={`GBPUSD 단독 ${g.worst_pct}%`} color="var(--down)" />
          <Tile label="누적 낙폭" value={`−${b.mdd_pct}%`} sub={`GBPUSD 단독 −${g.mdd_pct}%`} color="var(--down)" />
          <Tile label="양수 연도" value={`${b.pos_years}/${b.years}`} sub={`2015~20 ${b.half_a} · 2021~26 ${b.half_b}`} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={{ ...th, textAlign: "left" }}>구성</th><th style={th}>거래</th><th style={th}>건당</th><th style={th}>승률</th><th style={th}>t값</th><th style={th}>총이익÷총손실</th><th style={th}>큰 5건 제외</th><th style={th}>합계(단순 합)</th><th style={th}>연 환산</th><th style={th}>누적 낙폭</th><th style={th}>1건 최악</th><th style={th}>양수 연도</th><th style={th}>전반·후반</th>
            </tr></thead>
            <tbody>
              <StatsRow label="달러 바스켓 (6쌍 균등)" s={b} strong />
              <StatsRow label="GBPUSD 단독 숏" s={g} />
            </tbody>
          </table>
        </div>
        <p className="meta" style={{ margin: "10px 0 0", lineHeight: 1.6 }}>
          GBPUSD 단독 비용·스왑 2배 {fmtPct(g.cost2x_pct, 2)} (건당 총비용 {g.cost_pct}%). 결정 유형별 바스켓 건당: {Object.entries(s.by_decision || {}).filter(([k]) => k !== "미정").map(([k, v]) => `${k} ${fmtPct(v.basket_pct, 2)} (${v.n}건)`).join(" · ")}.
          최근 2년(2025~26) {s.recent.n}건 바스켓 {fmtPct(s.recent.basket_pct, 2)} · 단독 {fmtPct(s.recent.single_pct, 2)} — 그중 동결 회의 {s.recent.hold_n}회.
        </p>

        {/* 쌍별 */}
        <div className="meta" style={{ margin: "14px 0 6px", fontWeight: 700 }}>쌍별 — 같은 규칙을 통화마다 따로 본 결과 (교차 확인)</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={{ ...th, textAlign: "left" }}>쌍 · 방향</th><th style={th}>거래</th><th style={th}>건당</th><th style={th}>91건 공통</th><th style={th}>승률</th><th style={th}>t값</th><th style={th}>1건 최악</th><th style={th}>양수 연도</th><th style={th}>스프레드 왕복</th><th style={th}>밤 스왑</th><th style={th}>비용·스왑 2배</th>
            </tr></thead>
            <tbody>
              {s.pairs.map((r) => (
                <tr key={r.pair} style={{ opacity: r.in_basket ? 1 : 0.6 }}>
                  <td style={{ ...td, textAlign: "left", fontWeight: 700 }}>{r.pair} {r.side}{r.in_basket ? "" : " (제외)"}</td>
                  <td style={td}>{r.n}건</td>
                  <td style={{ ...td, color: tone(r.exp_pct), fontWeight: 700 }}>{fmtPct(r.exp_pct, 2)}</td>
                  <td style={{ ...td, color: tone(r.exp_common_pct) }}>{fmtPct(r.exp_common_pct, 2)}</td>
                  <td style={td}>{r.win_rate}%</td><td style={td}>{r.t}</td>
                  <td style={td}>{r.worst_pct}%</td><td style={td}>{r.pos_years}/{r.years}</td>
                  <td style={td}>{r.cost_pct}%</td><td style={td}>{r.swap_pct}%/밤 <span style={{ color: "var(--muted)" }}>({r.swap_kind})</span></td>
                  <td style={{ ...td, color: r.cost2x_pct == null ? "var(--muted)" : tone(r.cost2x_pct) }}>{r.cost2x_pct == null ? "—" : fmtPct(r.cost2x_pct, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="meta" style={{ margin: "10px 0 0", lineHeight: 1.6 }}>{s.pairs_note}</p>
      </Panel>

      {/* 차트 + 해별 */}
      <Panel icon="📈" title="누적 수익과 해별" meta="건당 합, 비용·스왑 후 · 실선 바스켓 / 점선 GBPUSD 단독 · 해별 막대는 건당 평균, 상승 빨강 / 하락 파랑" hover={false} pad={0}>
        <img src={`${data.chart}?v=${data.updated}-${b.n}`} alt={`${s.id} ${s.name} 누적 수익 곡선(바스켓 vs GBPUSD 단독)과 해별 건당 수익 막대`} loading="lazy"
          style={{ width: "100%", display: "block", borderRadius: "0 0 var(--radius, 14px) var(--radius, 14px)" }} />
        <div style={{ padding: "10px 14px 14px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {s.yearly.map((y) => (
            <Chip key={y.year} color={tone(y.basket_pct)} title={`GBPUSD 단독 건당 ${fmtPct(y.single_pct, 2)} · 바스켓 합계 ${fmtPct(y.basket_sum_pct, 2)}`}>{y.year} {fmtPct(y.basket_pct, 2)} · {y.n}건 (단독 {fmtPct(y.single_pct, 2)})</Chip>
          ))}
        </div>
      </Panel>
    </>
  );
}

function Trades({ S }) {
  const [open, setOpen] = useState(null);
  const cur = S.find((s) => s.id === open);
  return (
    <Panel icon="🧾" title="거래 목록" meta="전략을 누르면 펼침 · 진입·청산은 뉴욕 시간 19:00 · 수익은 비용·스왑 후 · 쌍별 수익은 표의 방향(달러 롱) 기준" hover={false}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: open ? 10 : 0 }}>
        {S.map((s) => (
          <button key={s.id} type="button" className="chip" onClick={() => setOpen(open === s.id ? null : s.id)} style={{ cursor: "pointer", font: "inherit", fontSize: "var(--fs-xs)", fontWeight: 700 }}>
            {open === s.id ? "접기 · " : ""}{s.id} {s.name} ({s.trades.length})
          </button>
        ))}
      </div>
      {cur && (
        <div style={{ overflowX: "auto", maxHeight: 420 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={{ ...th, textAlign: "left" }}>결정일</th><th style={th}>결정</th><th style={th}>진입</th><th style={th}>청산</th>
              {PAIRS.map((k) => <th key={k} style={th}>{k}</th>)}
              <th style={th}>바스켓</th><th style={th}>GBPUSD 진입가</th><th style={th}>청산가</th>
            </tr></thead>
            <tbody>
              {[...cur.trades].reverse().map((t) => (
                <tr key={t.event}>
                  <td style={{ ...td, textAlign: "left" }}>{t.event}</td>
                  <td style={{ ...td, color: t.decision === "동결" ? "var(--muted)" : "var(--warn)" }}>{t.decision}</td>
                  <td style={td}>{t.entry}</td><td style={td}>{t.exit}</td>
                  {PAIRS.map((k) => <td key={k} style={{ ...td, color: tone(t[k]), fontWeight: k === "GBPUSD" ? 700 : 400 }}>{fmtPct(t[k], 2)}</td>)}
                  <td style={{ ...td, color: tone(t.basket_pct), fontWeight: 700 }}>{fmtPct(t.basket_pct, 2)}</td>
                  <td style={{ ...td, color: "var(--text-2)" }}>{t.gbp_entry}</td><td style={{ ...td, color: "var(--text-2)" }}>{t.gbp_exit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

export default function FxBookView({ data }) {
  const S = data.strategies || [];
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Panel icon="🧭" title={`${data.label} (${data.symbol}) 며칠 보유 특징`} meta={data.data_note} hover={false} badge={<Chip color="var(--warn)">{data.status}</Chip>}>
        <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
          {(data.facts || []).map((f, i) => <li key={i} style={li}>{f}</li>)}
        </ul>
      </Panel>

      {S.map((s, i) => <Strategy key={s.id} s={s} data={data} n={i + 1} />)}

      <Panel icon="📐" title="공통 규칙 · 비용" hover={false}>
        <p style={p}>{data.rules_common}</p>
        <p style={{ ...p, margin: 0 }}>{data.costs}</p>
      </Panel>

      <Panel icon="🗑️" title="검토했다가 버린 것" meta={`${(data.rejected || []).length}가지`} hover={false}>
        <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
          {(data.rejected || []).map((c, i) => <li key={i} style={li}>{c}</li>)}
        </ul>
      </Panel>

      <Panel icon="⚠️" title="주의" meta={`${(data.caveats || []).length}가지 · 자체 엔진 · 독립 검증 구간 없음 · 실거래 전`} hover={false}>
        <ul style={{ margin: "0 0 10px", paddingLeft: 20, display: "grid", gap: 6 }}>
          {(data.caveats || []).map((c, i) => <li key={i} style={li}>{c}</li>)}
        </ul>
        {data.expectation && <p style={{ ...p, margin: 0, color: "var(--text)" }}>{data.expectation}</p>}
      </Panel>

      <Trades S={S} />
    </div>
  );
}
