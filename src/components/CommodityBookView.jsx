// 원자재 검증 기록 뷰 — /verified 원자재 탭 (2026-11-04). 금(XAUUSD) 전략 G1부터.
// 데이터: src/data/commodity_gold_book.json (reversion_research/backtests/build_gold_site.py)
// 코스피·나스닥 카드와 같은 구성이되, 금은 '개발 구간(규칙 확정) / 독립 검증 구간(한 번만 개방, 사전 기준 P1~P4)'을 나눠 보여 주는 것이 핵심이라
// 결과 카드가 개발·검증·전체 세 줄 표 + 검증 구간 타일 + 사전 기준 칩으로 되어 있다.
// 구성: 특징 → 전략마다(제목 → 규칙 표 → 직관 → 결과(개발/검증) → 누적 차트·연도별) → 공통 규칙·비용 → 버린 것 → 주의 → 거래 목록(접기)
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
      <td style={{ ...td, color: tone(s.exp_pct), fontWeight: strong ? 700 : 400 }}>{fmtPct(s.exp_pct, 3)}</td>
      <td style={td}>{s.win_rate}%</td>
      <td style={td}>{s.pf}배</td>
      <td style={{ ...td, color: tone(s.total_pct) }}>{fmtPct(s.total_pct, 2)}</td>
      <td style={{ ...td, color: tone(s.annual_pct) }}>{fmtPct(s.annual_pct, 2)}</td>
      <td style={td}>−{s.mdd_pct}%</td>
      <td style={td}>{s.worst_pct}%</td>
      <td style={td}>{s.pos_years}/{s.years}</td>
    </tr>
  );
}

function Strategy({ s, data, n }) {
  const st = s.stats; const o = st.oos; const d = st.dev;
  return (
    <>
      <SectionHead id={`${data.id_prefix}-${s.id.toLowerCase()}`} aside={<TopLink />} kicker={`${data.symbol} · STRATEGY ${s.id}`} title={`${n}. 전략 ${s.id} — 「${s.name}」`} desc={s.summary} />

      {/* 규칙 표 */}
      <Panel icon="📐" title="규칙" meta={`${s.side} · ${s.hold} · ${s.zone}`} hover={false}
        badge={<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><Chip color="var(--warn)">{data.badge}</Chip><Chip color="var(--cyan)">{st.all.period}</Chip></div>}>
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
      <Panel icon="💡" title="왜 되돌리나 — 직관과 근거" meta="규칙을 만들 때 확인한 것" hover={false}>
        <p style={p}>{s.why}</p>
        <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
          {(s.evidence || []).map((e, i) => <li key={i} style={li}>{e}</li>)}
        </ul>
      </Panel>

      {/* 결과 — 개발 / 독립 검증 */}
      <Panel icon="📊" title="결과 — 개발 구간과 독립 검증 구간" meta={`개발 ${d.window} · 검증 ${o.window} · 비용 후 · 1온스 고정`} hover={false}>
        <p style={p}>{s.split_note}</p>
        <div className="meta" style={{ marginBottom: 6, fontWeight: 700 }}>독립 검증 구간 — 규칙 확정 뒤 한 번만 열어 본 결과</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 12 }}>
          <Tile label="거래 수" value={`${o.n}건`} sub={`연 ${o.per_year}건 · 승률 ${o.win_rate}%`} />
          <Tile label="건당 수익 (비용 후)" value={fmtPct(o.exp_pct, 3)} sub={`개발 구간 ${fmtPct(d.exp_pct, 3)}`} color={tone(o.exp_pct)} />
          <Tile label="큰 2건 뺀 건당" value={fmtPct(o.x2_pct, 3)} color={tone(o.x2_pct)} />
          <Tile label="비용 2배로 잡은 건당" value={fmtPct(o.fee2x_pct, 3)} color={tone(o.fee2x_pct)} />
          <Tile label="양수 연도" value={`${o.pos_years}/${o.years}`} sub={`개발 구간 ${d.pos_years}/${d.years}`} />
          <Tile label="1온스당 건당" value={`${o.usd_per_oz > 0 ? "+" : ""}${o.usd_per_oz}달러`} sub={`중앙값 ${o.usd_median > 0 ? "+" : ""}${o.usd_median}달러`} color={tone(o.usd_per_oz)} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {(s.criteria || []).map((c) => (
            <Chip key={c.id} color={c.ok ? "var(--ok)" : "var(--down)"} title={c.text}>{c.ok ? "✓" : "✗"} {c.id} {c.text} — {c.value}</Chip>
          ))}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={{ ...th, textAlign: "left" }}>구간</th><th style={th}>거래</th><th style={th}>건당</th><th style={th}>승률</th><th style={th}>총이익÷총손실</th><th style={th}>합계(단순 합)</th><th style={th}>연 환산</th><th style={th}>최대 낙폭</th><th style={th}>1건 최악</th><th style={th}>양수 연도</th>
            </tr></thead>
            <tbody>
              <StatsRow label={`개발 (${d.period})`} s={d} />
              <StatsRow label={`독립 검증 (${o.period})`} s={o} strong />
              <StatsRow label={`전체 (${st.all.period})`} s={st.all} />
            </tbody>
          </table>
        </div>
        <p className="meta" style={{ margin: "10px 0 0", lineHeight: 1.6 }}>{s.hfm_note}</p>
        <p className="meta" style={{ margin: "6px 0 0", lineHeight: 1.6 }}>{s.usd_note}</p>
      </Panel>

      {/* 차트 + 연도별 */}
      <Panel icon="📈" title="누적 수익과 연도별" meta="단순 합, 비용 후 · 점선 오른쪽이 검증 구간 · 상승 빨강 / 하락 파랑" hover={false} pad={0}>
        <img src={`${data.chart}?v=${data.updated}-${st.all.n}`} alt={`${s.id} ${s.name} 누적 수익 곡선(개발·검증 경계 표시)과 연도별 수익 막대`} loading="lazy"
          style={{ width: "100%", display: "block", borderRadius: "0 0 var(--radius, 14px) var(--radius, 14px)" }} />
        <div style={{ padding: "10px 14px 14px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {s.yearly.map((y) => (
            <Chip key={y.year} color={tone(y.ret_pct)} title={y.period === "oos" ? "독립 검증 구간" : "개발 구간"}>{y.period === "oos" ? "검증 " : ""}{y.year} {fmtPct(y.ret_pct, 2)} · {y.n}건</Chip>
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
    <Panel icon="🧾" title="거래 목록" meta="전략을 누르면 펼침 · 시각은 뉴욕 현지 · 수익은 비용 후" hover={false}>
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
            <thead><tr><th style={{ ...th, textAlign: "left" }}>날짜</th><th style={th}>구간</th><th style={th}>진입</th><th style={th}>청산</th><th style={th}>진입가</th><th style={th}>청산가</th><th style={th}>마감 전 15분</th><th style={th}>문턱</th><th style={th}>수익(후)</th></tr></thead>
            <tbody>
              {[...cur.trades].reverse().map((t) => (
                <tr key={t.date}>
                  <td style={{ ...td, textAlign: "left" }}>{t.date}</td><td style={{ ...td, color: t.period === "검증" ? "var(--warn)" : "var(--muted)" }}>{t.period}</td>
                  <td style={td}>{t.entry_time}</td><td style={td}>{t.exit_time}</td>
                  <td style={td}>{t.entry.toLocaleString()}</td><td style={td}>{t.exit.toLocaleString()}</td>
                  <td style={{ ...td, color: "var(--text-2)" }}>{fmtPct(t.signal_pct, 3)}</td><td style={{ ...td, color: "var(--muted)" }}>{fmtPct(t.threshold_pct, 3)}</td>
                  <td style={{ ...td, color: tone(t.ret_pct), fontWeight: 700 }}>{fmtPct(t.ret_pct, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

export default function CommodityBookView({ data }) {
  const S = data.strategies || [];
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Panel icon="🧭" title={`${data.label} (${data.symbol}) 시간대 특징`} meta={data.data_note} hover={false} badge={<Chip color="var(--warn)">{data.status}</Chip>}>
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

      <Panel icon="⚠️" title="주의" meta={`${(data.caveats || []).length}가지 · 자체 엔진 · 실거래 전`} hover={false}>
        <ul style={{ margin: "0 0 10px", paddingLeft: 20, display: "grid", gap: 6 }}>
          {(data.caveats || []).map((c, i) => <li key={i} style={li}>{c}</li>)}
        </ul>
        {data.expectation && <p style={{ ...p, margin: 0, color: "var(--text)" }}>{data.expectation}</p>}
      </Panel>

      <Trades S={S} />
    </div>
  );
}
