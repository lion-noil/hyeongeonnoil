// 성적표 뷰 — report.data(kind=perf: 계좌별 주별·월별 실현·수익률 vs 월 2% 목표)를 표+막대로.
// 스키마: News_scrap/app/perf_report.py build()  { accounts:[{name,currency,months[],weeks[],recent8w,...}], target_month_pct }
import Link from "next/link";

const card = { background: "var(--panel-2)", borderRadius: 10, padding: "14px 16px", marginBottom: 12 };
const th = { textAlign: "left", color: "#9bd", fontSize: 12, borderBottom: "1px solid var(--line)", whiteSpace: "nowrap" };
const td = { borderBottom: "1px solid var(--line)", whiteSpace: "nowrap" };

const f = (v, d = 1) => (v == null ? "" : `${v > 0 ? "+" : ""}${Number(v).toFixed(d)}`);
const money = (v, ccy) => (v == null ? "" : `${v > 0 ? "+" : ""}${Number(v).toFixed(v >= 100 || v <= -100 ? 0 : 2)} ${ccy}`);
// 표 안 금액: 통화 표기는 좁은 화면에서 숨김(.perf-ccy) — 표가 화면 안에 들어오게. 칸 여백·막대 폭도 globals.css .perf-* 에서 반응형.
const Money = ({ v, ccy }) => (v == null ? null : <>{money(v, "").trim()}<span className="perf-ccy"> {ccy}</span></>);

// 게이지 = 목표 달성률: 목표(월 2%·주 0.46%)에 닿으면 가득 참. 손실은 같은 눈금의 빨간 막대.
function Bar({ pct, hit, target }) {
  if (pct == null) return <span style={{ color: "#666" }}>—</span>;
  const w = Math.min(100, (Math.abs(pct) / target) * 100);
  const color = pct >= 0 ? (hit ? "#00ffcc" : "#7fbfb5") : "#ff6b6b";
  return (
    <div className="perf-bar" style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div className="perf-track" style={{ height: 8, flex: "0 0 auto", background: "var(--panel)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${w}%`, height: "100%", background: color }} />
      </div>
      <span style={{ color, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>{f(pct, 2)}%</span>
    </div>
  );
}

// 유니버스 카드 = 기준 3칸(목표 수익률 · 시뮬 최대 낙폭 · 시뮬 평균 진입) + 월별 표(수익률·낙폭·진입, 기준 대비 ✓/✗).
// 달성 판정: 수익률 ≥ 목표, 낙폭 ≤ 5년 시뮬 최대 낙폭, 진입은 시뮬 달 90% 범위 안이면 정상(perf_report.py entries_fit).
function Goal({ label, value, sub }) {
  return (
    <div style={{ background: "var(--panel)", borderRadius: 8, padding: "7px 9px", minWidth: 0 }}>
      <div style={{ color: "#9bd", fontSize: 11 }}>{label}</div>
      <div style={{ color: "#eee", fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{value}</div>
      {sub && <div style={{ color: "#888", fontSize: 10.5 }}>{sub}</div>}
    </div>
  );
}
const Mark = ({ ok }) => <span style={{ color: ok ? "#00ffcc" : "#ff6b6b", fontSize: 12 }}> {ok ? "✓" : "✗"}</span>;
const num = { ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" };
const thR = { ...th, textAlign: "right" };
const avg = (xs) => (xs.length ? xs.reduce((x, y) => x + y, 0) / xs.length : null);

function AccountBlock({ a, targetM: gM, targetW: gW, compact, prop }) {
  // 유니버스별 목표(환율은 월 1%) — 없으면 전체 목표
  const targetM = a.target_month_pct ?? gM;
  const targetW = a.target_week_pct ?? gW;
  // 평가손 포함 낙폭·하루 최대 낙폭: 실행기 평가액 기록이 있는 달(2026-10~)만 값이 있다 → 값이 있을 때만 열을 낸다
  const hasMtm = (a.months || []).some((m) => m.mtm_dd != null);
  // 평가손 기준 = 같은 전략 5년 시뮬(보유 포지션을 그 시간 최악가로 평가): 평가낙폭은 달 95%가 이내였던 값, 일최대는 날 99%가 이내였던 값
  const mtmSim = a.stats?.sim?.mtm;
  const mtmLim = mtmSim?.month_dd?.p95 ?? prop?.total_dd;
  const dayLim = mtmSim?.day_dd?.p99 ?? prop?.daily_dd;
  const sim = a.stats?.sim;
  const from = (a.stats?.from || "").slice(0, 7);
  // 요약 화면은 현행 전략 달만(그 전 달은 다른 전략이라 비교 대상이 아님), 전체 보기는 모든 달
  const months = (a.months || []).filter((m) => !compact || !from || m.ym >= from);
  const judged = months.filter((m) => m.dd_fit && !m.partial); // 시뮬과 비교하는 완결 달
  const weeks = (a.weeks || []).slice(-16);
  return (
    <div className="perf-card" style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, alignItems: "baseline" }}>
        <span style={{ color: "#00ffcc", fontWeight: 600, fontSize: 16 }}>{a.name}</span>
        {a.equity_last && (
          <span style={{ color: "#bbb", fontSize: 13 }}>
            계좌 평가액 <b style={{ color: "#eee" }}>{Number(a.equity_last.value).toLocaleString()}</b> {a.currency}
          </span>
        )}
      </div>

      {/* 기준 3칸: 이 유니버스가 맞춰야 할 숫자 — 목표 수익률, 5년 시뮬의 최대 낙폭·월 평균 진입 횟수 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6, marginTop: 10 }}>
        <Goal label="목표 수익률" value={`월 ${targetM}%`} sub="이상이면 달성" />
        <Goal label="시뮬 최대 낙폭" value={sim ? `${sim.mdd}%` : "—"} sub="이내면 달성" />
        <Goal label="시뮬 평균 진입" value={sim ? `월 ${Math.round(sim.trades_per_month)}건` : "—"}
          sub={sim?.month_entries ? `${sim.month_entries.p5}~${sim.month_entries.p95}건이면 정상` : ""} />
      </div>
      {mtmSim && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6, marginTop: 6 }}>
          <Goal label="시뮬 평가낙폭 (평가손 포함)" value={`월 ${mtmSim.month_dd.p95}%`} sub={`이내면 달성 · 5년 최악 ${mtmSim.month_dd.max}%`} />
          <Goal label="시뮬 일최대 낙폭" value={`하루 ${mtmSim.day_dd.p99}%`} sub={`이내면 달성 · 5년 최악 ${mtmSim.day_dd.max}%`} />
        </div>
      )}
      {hasMtm && prop && (
        <div style={{ color: "#888", fontSize: 11, marginTop: 6, lineHeight: 1.6 }}>
          평가낙폭·일최대는 {prop.since.slice(5)}부터 기록 · 참고로 프랍 통상 선은 총 {prop.total_dd}% · 하루 {prop.daily_dd}%
        </div>
      )}

      <div style={{ overflowX: "auto", marginTop: 10 }}>
        <table className="perf-table" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead><tr><th style={th}>월</th><th style={th}>수익률</th><th style={thR}>낙폭</th><th style={thR}>진입</th>{hasMtm && <><th style={thR}>평가낙폭</th><th style={thR}>일최대</th></>}</tr></thead>
          <tbody>
            {months.map((m) => {
              const judge = !!m.dd_fit;   // 현행 전략으로만 돈 달(08월~)만 기준과 비교
              const ddOk = judge && sim && m.dd != null ? m.dd <= sim.mdd : null;
              const enOk = m.entries_fit ? m.entries_fit === "적합" : null;
              return (
                <tr key={m.ym}>
                  <td style={td}>{m.ym}{m.partial ? <span style={{ color: "#ff9f5a", fontSize: 11 }}> 진행중</span> : ""}</td>
                  <td style={td}><div style={{ display: "flex", alignItems: "center" }}><Bar pct={m.pct} hit={m.hit} target={targetM} />{judge && !m.partial && <Mark ok={!!m.hit} />}</div></td>
                  <td style={{ ...num, color: ddOk == null ? "#999" : ddOk ? "#00ffcc" : "#ff6b6b" }}>{m.dd == null ? "" : `${m.dd.toFixed(2)}%`}{ddOk != null && <Mark ok={ddOk} />}</td>
                  <td style={{ ...num, color: enOk == null ? "#999" : enOk ? "#00ffcc" : "#ffd479" }}>{m.entries == null ? "" : `${m.entries}건`}{enOk != null && (enOk ? <Mark ok /> : <span style={{ fontSize: 11 }}> {m.entries_fit}</span>)}</td>
                  {hasMtm && (
                    <>
                      <td style={{ ...num, color: m.mtm_dd == null ? "#999" : m.mtm_dd <= mtmLim ? "#00ffcc" : "#ff6b6b" }}>{m.mtm_dd == null ? "—" : <>{m.mtm_dd.toFixed(2)}%<Mark ok={m.mtm_dd <= mtmLim} /></>}</td>
                      <td style={{ ...num, color: m.day_dd_max == null ? "#999" : m.day_dd_max <= dayLim ? "#00ffcc" : "#ff6b6b" }}>{m.day_dd_max == null ? "—" : <>{m.day_dd_max.toFixed(2)}%<Mark ok={m.day_dd_max <= dayLim} /></>}</td>
                    </>
                  )}
                </tr>
              );
            })}
            {judged.length > 0 && (() => {
              const p = avg(judged.map((m) => m.pct)), d = Math.max(...judged.map((m) => m.dd)), e = avg(judged.map((m) => m.entries));
              return (
                <tr>
                  <td style={{ ...td, color: "#9bd" }}>{judged[0].ym.slice(5)}~{judged[judged.length - 1].ym.slice(5)}월 <span style={{ color: "#777", fontSize: 11 }}>평균·최대</span></td>
                  <td style={{ ...td, color: p >= targetM ? "#00ffcc" : "#ffd479", fontVariantNumeric: "tabular-nums" }}>평균 {f(p, 2)}%<Mark ok={p >= targetM} /></td>
                  <td style={{ ...num, color: sim && d > sim.mdd ? "#ff6b6b" : "#00ffcc" }}>최대 {d.toFixed(2)}%{sim && <Mark ok={d <= sim.mdd} />}</td>
                  <td style={{ ...num, color: "#eee" }}>평균 {e.toFixed(0)}건</td>
                  {hasMtm && <><td style={td} /><td style={td} /></>}
                </tr>
              );
            })()}
          </tbody>
        </table>
      </div>

      {!compact && (
        <div style={{ overflowX: "auto", marginTop: 14 }}>
          <table className="perf-table" style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead><tr><th style={th}>주</th><th style={th}>청산</th><th style={th}>실현</th><th style={th}>수익률 (주 목표 {targetW}%)</th></tr></thead>
            <tbody>
              {weeks.map((w) => (
                <tr key={w.label}>
                  <td style={td}><span className="perf-yr">{w.label.slice(0, 5)}</span>{w.label.slice(5)}<span style={{ color: "#777", fontSize: 11 }}> {w.monday.slice(5)}</span>{w.partial ? <span style={{ color: "#ff9f5a", fontSize: 11 }}> 진행중</span> : ""}</td>
                  <td style={{ ...td, color: "#888" }}>{w.n}</td>
                  <td style={{ ...td, color: w.realized >= 0 ? "#dfe" : "#fbb" }}><Money v={w.realized} ccy={a.currency} /></td>
                  <td style={td}><Bar pct={w.pct} hit={w.hit} target={targetW} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function PerfView({ data, compact = false }) {
  if (!data?.accounts) return null;
  const targetM = data.target_month_pct ?? 2;
  const targetW = data.target_week_pct ?? 0.46;
  const fxT = data.accounts.find((a) => a.target_month_pct != null && a.target_month_pct !== targetM)?.target_month_pct;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6, margin: "4px 0 6px" }}>
        <h2 style={{ color: "#00bfff", fontSize: 19, margin: 0 }}>📈 성적표 <span style={{ color: "#888", fontSize: 13 }}>유니버스별 월 성적 · 목표 월 {targetM}%{fxT ? ` (환율 ${fxT}%)` : ""} · 갱신 {String(data.generated_at || "").slice(0, 16).replace("T", " ")}</span></h2>
        {compact && <Link href="/reports/perf-latest" style={{ color: "#00ffcc", fontSize: 13 }}>전체 보기 →</Link>}
      </div>
      <p style={{ color: "#999", fontSize: 12, lineHeight: 1.7, margin: "0 0 10px" }}>
        <b style={{ color: "#bbb" }}>수익률</b> 그 달 청산 손익 ÷ 월초 계좌 평가액 · <b style={{ color: "#bbb" }}>낙폭</b> 그 달 누적 손익이 고점에서 가장 많이 내려간 폭 · <b style={{ color: "#bbb" }}>진입</b> 그 달 새로 연 포지션 수 · <b style={{ color: "#bbb" }}>평가낙폭</b> 들고 있는 포지션의 평가손까지 넣은 계좌 평가액이 월중 고점에서 내려간 폭 · <b style={{ color: "#bbb" }}>일최대</b> 하루 중 시작 평가액 대비 가장 많이 내려간 폭.
        {" "}각 카드 위 칸들이 기준(시뮬 = 같은 전략을 5년 돌린 결과), 표의 <span style={{ color: "#00ffcc" }}>✓</span> 달성 · <span style={{ color: "#ff6b6b" }}>✗</span> 미달 · 회색은 옛 전략 달이라 비교 안 함.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", gap: 12 }}>
        {data.accounts.map((a) => <AccountBlock key={a.account} a={a} targetM={targetM} targetW={targetW} compact={compact} prop={data.prop} />)}
      </div>
      {!compact && data.note && <p style={{ color: "#777", fontSize: 12, lineHeight: 1.6 }}>{data.note}</p>}
    </div>
  );
}
