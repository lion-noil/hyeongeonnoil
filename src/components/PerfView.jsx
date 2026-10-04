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

// 지표 타일: 07-16(현행 셀 확정) 이후 실측 vs 시뮬 기준(perf_benchmark.json). 낙폭 판정색 = 평소 범위/시뮬 최악 이내/초과.
const DD_COLOR = { "평소 범위": "#00ffcc", "시뮬 최악 이내": "#ffd479", "시뮬 최악 초과": "#ff6b6b" };
function Tile({ label, value, sub, color = "#eee" }) {
  return (
    <div style={{ background: "var(--panel)", borderRadius: 8, padding: "8px 10px", minWidth: 0 }}>
      <div style={{ color: "#9bd", fontSize: 11 }}>{label}</div>
      <div style={{ color, fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ color: "#888", fontSize: 11, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}

function Stats({ st }) {
  if (!st) return null;
  const sim = st.sim;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))", gap: 6 }}>
        <Tile label="진입 빈도" value={`월 ${st.entries_per_month}건`} sub={<>{sim && <>시뮬 {sim.trades_per_month}건 · </>}누적 {st.entries}건</>} />
        {st.trade_avg_eq_pct != null && (
          <Tile label="건당 평균(계좌 대비)" value={`${f(st.trade_avg_eq_pct, 3)}%`} color={st.trade_avg_eq_pct >= 0 ? "#00ffcc" : "#ff6b6b"}
            sub={sim && `시뮬 ${f(sim.trade_avg_eq_pct, 3)}%`} />
        )}
        {st.win_rate != null && <Tile label="승률" value={`${Math.round(st.win_rate)}%`} sub={sim && `시뮬 ${Math.round(sim.win_rate)}%`} />}
        <Tile label="최대 낙폭(실현)" value={`${st.mdd.toFixed(2)}%p`} color={DD_COLOR[st.dd_verdict] || "#eee"}
          sub={<>{st.mdd_to && <>{st.mdd_from.slice(5)}~{st.mdd_to.slice(5)} · </>}지금 {st.dd_now.toFixed(2)}%p</>} />
        {sim && (
          <Tile label="시뮬 낙폭 기준" value={st.dd_verdict} color={DD_COLOR[st.dd_verdict]}
            sub={`평소 ${sim.dd_p95}%p · 5년 최악 ${sim.mdd}%p`} />
        )}
        {st.eq_mdd != null && <Tile label="에쿼티 낙폭(미실현 포함)" value={`${st.eq_mdd.toFixed(1)}%`} sub={`지금 ${st.eq_dd_now.toFixed(1)}% · 입출금 섞임`} />}
      </div>
      <div style={{ color: "#777", fontSize: 11, marginTop: 4 }}>{st.from.slice(5)} 이후(현행 셀 구성) 집계</div>
    </div>
  );
}

// 월별 시뮬 적합 판정색: 낙폭 정상/주의/이탈, 진입 적합/많음/적음 (perf_report.py months[].dd_fit·entries_fit)
const FIT_COLOR = { 정상: "#00ffcc", 적합: "#00ffcc", 주의: "#ffd479", 많음: "#ffd479", 적음: "#ffd479", 이탈: "#ff6b6b" };
const Fit = ({ v }) => (v ? <span style={{ color: FIT_COLOR[v] || "#888", fontSize: 11 }}> {v}</span> : null);

function AccountBlock({ a, targetM, targetW, compact }) {
  const months = a.months || [];
  const weeks = (a.weeks || []).slice(compact ? -8 : -16);
  const r8 = a.recent8w || {};
  return (
    <div className="perf-card" style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, alignItems: "baseline" }}>
        <span style={{ color: "#00ffcc", fontWeight: 600, fontSize: 16 }}>{a.name}</span>
        {a.equity_last && (
          <span style={{ color: "#bbb", fontSize: 13 }}>
            에쿼티 {Number(a.equity_first.value).toLocaleString()} → <b style={{ color: "#eee" }}>{Number(a.equity_last.value).toLocaleString()}</b> {a.currency}
            <span style={{ color: a.equity_change_pct >= 0 ? "#00ffcc" : "#ff6b6b" }}> ({f(a.equity_change_pct)}%)</span>
          </span>
        )}
      </div>
      <div style={{ color: "#bbb", fontSize: 13, marginTop: 6, lineHeight: 1.7 }}>
        최근 {r8.weeks}주 실현 <b style={{ color: r8.realized >= 0 ? "#00ffcc" : "#ff6b6b" }}>{money(r8.realized, a.currency)}</b>
        {r8.pct != null && <> ({f(r8.pct)}%)</>} · 주 목표 {targetW}% 달성 {r8.hit_weeks}/{r8.weeks}주
        {a.months_avg_pct != null && <> · 완결 월 평균 <b style={{ color: a.months_avg_pct >= targetM ? "#00ffcc" : "#ffd479" }}>{f(a.months_avg_pct, 2)}%</b> (달성 {a.months_hit})</>}
      </div>
      <Stats st={a.stats} />

      <div style={{ overflowX: "auto", marginTop: 10 }}>
        <table className="perf-table" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead><tr><th style={th}>월</th><th style={th}>진입</th><th style={th}>청산</th><th style={th}>실현</th><th style={th}>수익률 (목표 {targetM}%)</th><th style={th}>낙폭</th></tr></thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.ym}>
                <td style={td}>{m.ym}{m.partial ? <span style={{ color: "#ff9f5a", fontSize: 11 }}> 진행중</span> : ""}</td>
                <td style={{ ...td, color: "#888" }}>{m.entries ?? ""}<Fit v={m.entries_fit} /></td>
                <td style={{ ...td, color: "#888" }}>{m.n}</td>
                <td style={{ ...td, color: m.realized >= 0 ? "#dfe" : "#fbb" }}><Money v={m.realized} ccy={a.currency} /></td>
                <td style={td}><Bar pct={m.pct} hit={m.hit} target={targetM} /></td>
                <td style={{ ...td, color: "#bbb" }}>{m.dd == null ? "" : `${m.dd.toFixed(2)}`}<Fit v={m.dd_fit} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {a.stats?.sim?.month_dd && (
        <div style={{ color: "#888", fontSize: 11, marginTop: 4, lineHeight: 1.6 }}>
          시뮬 한 달 기준 — 진입 {a.stats.sim.month_entries.p5}~{a.stats.sim.month_entries.p95}건(중앙 {a.stats.sim.month_entries.p50})
          · 낙폭 평소 {a.stats.sim.month_dd.p50}%p, 95% {a.stats.sim.month_dd.p95}%p, 최악 {a.stats.sim.month_dd.max}%p
        </div>
      )}

      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table className="perf-table" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead><tr><th style={th}>주</th><th style={th}>청산</th><th style={th}>실현</th><th style={th}>수익률 (주 목표 {targetW}%)</th>{!compact && <th style={th}>에쿼티Δ</th>}</tr></thead>
          <tbody>
            {weeks.map((w) => (
              <tr key={w.label}>
                <td style={td}><span className="perf-yr">{w.label.slice(0, 5)}</span>{w.label.slice(5)}<span style={{ color: "#777", fontSize: 11 }}> {w.monday.slice(5)}</span>{w.partial ? <span style={{ color: "#ff9f5a", fontSize: 11 }}> 진행중</span> : ""}</td>
                <td style={{ ...td, color: "#888" }}>{w.n}</td>
                <td style={{ ...td, color: w.realized >= 0 ? "#dfe" : "#fbb" }}><Money v={w.realized} ccy={a.currency} /></td>
                <td style={td}><Bar pct={w.pct} hit={w.hit} target={targetW} /></td>
                {!compact && <td style={{ ...td, color: "#999" }}>{w.eqd == null ? "" : `${f(w.eqd, 2)}%`}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PerfView({ data, compact = false }) {
  if (!data?.accounts) return null;
  const targetM = data.target_month_pct ?? 2;
  const targetW = data.target_week_pct ?? 0.46;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6, margin: "4px 0 10px" }}>
        <h2 style={{ color: "#00bfff", fontSize: 19, margin: 0 }}>📈 성적표 <span style={{ color: "#888", fontSize: 13 }}>목표 월 {targetM}% · 갱신 {String(data.generated_at || "").slice(0, 16).replace("T", " ")}</span></h2>
        {compact && <Link href="/reports/perf-latest" style={{ color: "#00ffcc", fontSize: 13 }}>전체 보기 →</Link>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 440px), 1fr))", gap: 12 }}>
        {data.accounts.map((a) => <AccountBlock key={a.account} a={a} targetM={targetM} targetW={targetW} compact={compact} />)}
      </div>
      {!compact && data.note && <p style={{ color: "#777", fontSize: 12, lineHeight: 1.6 }}>{data.note}</p>}
    </div>
  );
}
