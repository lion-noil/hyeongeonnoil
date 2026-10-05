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

// 유니버스 카드 = 월별 표 하나: 수익률(목표 2%) · 낙폭 · 진입 수. 아래 줄들은 비교 기준(실제 평균, 5년 시뮬 평균·범위).
// 숫자 색 = 시뮬 한 달 분포 대비: 초록 범위 안 · 노랑 범위 밖 · 빨강 시뮬 최악 초과 (perf_report.py months[].dd_fit·entries_fit)
const FIT_COLOR = { 정상: "#00ffcc", 적합: "#00ffcc", 주의: "#ffd479", 많음: "#ffd479", 적음: "#ffd479", 이탈: "#ff6b6b" };
const num = { ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" };
const thR = { ...th, textAlign: "right" };
const avg = (xs) => (xs.length ? xs.reduce((x, y) => x + y, 0) / xs.length : null);

function AccountBlock({ a, targetM, targetW, compact }) {
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

      <div style={{ overflowX: "auto", marginTop: 10 }}>
        <table className="perf-table" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead><tr><th style={th}>월</th><th style={th}>수익률 (목표 {targetM}%)</th><th style={thR}>낙폭</th><th style={thR}>진입</th></tr></thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.ym}>
                <td style={td}>{m.ym}{m.partial ? <span style={{ color: "#ff9f5a", fontSize: 11 }}> 진행중</span> : ""}</td>
                <td style={td}><Bar pct={m.pct} hit={m.hit} target={targetM} /></td>
                <td style={{ ...num, color: FIT_COLOR[m.dd_fit] || "#999" }}>{m.dd == null ? "" : `${m.dd.toFixed(2)}%`}</td>
                <td style={{ ...num, color: FIT_COLOR[m.entries_fit] || "#999" }}>{m.entries == null ? "" : `${m.entries}건`}</td>
              </tr>
            ))}
            {judged.length > 0 && (
              <tr>
                <td style={{ ...td, color: "#9bd" }}>실제 평균 <span style={{ color: "#777", fontSize: 11 }}>{judged[0].ym.slice(5)}~{judged[judged.length - 1].ym.slice(5)}월</span></td>
                <td style={{ ...td, color: "#eee", fontVariantNumeric: "tabular-nums" }}>{f(avg(judged.map((m) => m.pct)), 2)}%</td>
                <td style={{ ...num, color: "#eee" }}>{avg(judged.map((m) => m.dd)).toFixed(2)}%</td>
                <td style={{ ...num, color: "#eee" }}>{avg(judged.map((m) => m.entries)).toFixed(0)}건</td>
              </tr>
            )}
            {sim?.month_dd && (
              <>
                <tr>
                  <td style={{ ...td, color: "#9bd" }}>시뮬 평균 <span style={{ color: "#777", fontSize: 11 }}>5년</span></td>
                  <td style={{ ...td, color: "#bbb", fontVariantNumeric: "tabular-nums" }}>{f(sim.month_mean, 2)}%</td>
                  <td style={{ ...num, color: "#bbb" }}>{(sim.month_dd.mean ?? sim.month_dd.p50).toFixed(2)}%</td>
                  <td style={{ ...num, color: "#bbb" }}>{Math.round(sim.trades_per_month)}건</td>
                </tr>
                <tr>
                  <td style={{ ...td, color: "#9bd" }}>시뮬 범위 <span style={{ color: "#777", fontSize: 11 }}>달 90%</span></td>
                  <td style={{ ...td, color: "#888", fontVariantNumeric: "tabular-nums" }}>{f(sim.month_pct.p5, 1)} ~ {f(sim.month_pct.p95, 1)}%</td>
                  <td style={{ ...num, color: "#888" }}>~{sim.month_dd.p95}%</td>
                  <td style={{ ...num, color: "#888" }}>{sim.month_entries.p5}~{sim.month_entries.p95}건</td>
                </tr>
              </>
            )}
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
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6, margin: "4px 0 6px" }}>
        <h2 style={{ color: "#00bfff", fontSize: 19, margin: 0 }}>📈 성적표 <span style={{ color: "#888", fontSize: 13 }}>유니버스별 월 성적 · 목표 월 {targetM}% · 갱신 {String(data.generated_at || "").slice(0, 16).replace("T", " ")}</span></h2>
        {compact && <Link href="/reports/perf-latest" style={{ color: "#00ffcc", fontSize: 13 }}>전체 보기 →</Link>}
      </div>
      <p style={{ color: "#999", fontSize: 12, lineHeight: 1.7, margin: "0 0 10px" }}>
        <b style={{ color: "#bbb" }}>수익률</b> 그 달 청산 손익 ÷ 월초 계좌 평가액 · <b style={{ color: "#bbb" }}>낙폭</b> 그 달 누적 손익이 고점에서 가장 많이 내려간 폭 · <b style={{ color: "#bbb" }}>진입</b> 그 달 새로 연 포지션 수.
        {" "}낙폭·진입 숫자 색: <span style={{ color: "#00ffcc" }}>초록</span> 시뮬 범위 안 · <span style={{ color: "#ffd479" }}>노랑</span> 범위 밖 · <span style={{ color: "#ff6b6b" }}>빨강</span> 5년 시뮬 최악 초과 · 회색 비교 안 함.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", gap: 12 }}>
        {data.accounts.map((a) => <AccountBlock key={a.account} a={a} targetM={targetM} targetW={targetW} compact={compact} />)}
      </div>
      {!compact && data.note && <p style={{ color: "#777", fontSize: 12, lineHeight: 1.6 }}>{data.note}</p>}
    </div>
  );
}
