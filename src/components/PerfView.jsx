// 성적표 뷰 — report.data(kind=perf: 계좌별 주별·월별 실현·수익률 vs 월 2% 목표)를 표+막대로.
// 스키마: News_scrap/app/perf_report.py build()  { accounts:[{name,currency,months[],weeks[],recent8w,...}], target_month_pct }
import Link from "next/link";

const card = { background: "#242424", borderRadius: 10, padding: "14px 16px", marginBottom: 12 };
const th = { textAlign: "left", padding: "4px 8px", color: "#9bd", fontSize: 12, borderBottom: "1px solid #444", whiteSpace: "nowrap" };
const td = { padding: "4px 8px", fontSize: 13, borderBottom: "1px solid #2e2e2e", whiteSpace: "nowrap" };

const f = (v, d = 1) => (v == null ? "" : `${v > 0 ? "+" : ""}${Number(v).toFixed(d)}`);
const money = (v, ccy) => (v == null ? "" : `${v > 0 ? "+" : ""}${Number(v).toFixed(v >= 100 || v <= -100 ? 0 : 2)} ${ccy}`);

function Bar({ pct, hit, scale }) {
  if (pct == null) return <span style={{ color: "#666" }}>—</span>;
  const w = Math.min(100, (Math.abs(pct) / scale) * 100);
  const color = pct >= 0 ? (hit ? "#00ffcc" : "#7fbfb5") : "#ff6b6b";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 150 }}>
      <div style={{ width: 90, height: 8, background: "#1a1a1a", borderRadius: 4, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", left: pct >= 0 ? "50%" : `${50 - w / 2}%`, width: `${w / 2}%`, height: "100%", background: color }} />
        <div style={{ position: "absolute", left: "50%", width: 1, height: "100%", background: "#555" }} />
      </div>
      <span style={{ color, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>{f(pct, 2)}%</span>
    </div>
  );
}

function AccountBlock({ a, targetM, targetW, compact }) {
  const months = a.months || [];
  const weeks = (a.weeks || []).slice(compact ? -8 : -16);
  const scaleM = Math.max(5, ...months.map((m) => Math.abs(m.pct || 0)));
  const scaleW = Math.max(2, ...weeks.map((w) => Math.abs(w.pct || 0)));
  const r8 = a.recent8w || {};
  return (
    <div style={card}>
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

      <div style={{ overflowX: "auto", marginTop: 10 }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead><tr><th style={th}>월</th><th style={th}>n</th><th style={th}>실현</th><th style={th}>수익률 (목표 {targetM}%)</th></tr></thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.ym}>
                <td style={td}>{m.ym}{m.partial ? <span style={{ color: "#ff9f5a", fontSize: 11 }}> 진행중</span> : ""}</td>
                <td style={{ ...td, color: "#888" }}>{m.n}</td>
                <td style={{ ...td, color: m.realized >= 0 ? "#dfe" : "#fbb" }}>{money(m.realized, a.currency)}</td>
                <td style={td}><Bar pct={m.pct} hit={m.hit} scale={scaleM} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead><tr><th style={th}>주</th><th style={th}>n</th><th style={th}>실현</th><th style={th}>수익률 (주 목표 {targetW}%)</th>{!compact && <th style={th}>에쿼티Δ</th>}</tr></thead>
          <tbody>
            {weeks.map((w) => (
              <tr key={w.label}>
                <td style={td}>{w.label}<span style={{ color: "#777", fontSize: 11 }}> {w.monday.slice(5)}</span>{w.partial ? <span style={{ color: "#ff9f5a", fontSize: 11 }}> 진행중</span> : ""}</td>
                <td style={{ ...td, color: "#888" }}>{w.n}</td>
                <td style={{ ...td, color: w.realized >= 0 ? "#dfe" : "#fbb" }}>{money(w.realized, a.currency)}</td>
                <td style={td}><Bar pct={w.pct} hit={w.hit} scale={scaleW} /></td>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 12 }}>
        {data.accounts.map((a) => <AccountBlock key={a.account} a={a} targetM={targetM} targetW={targetW} compact={compact} />)}
      </div>
      {!compact && data.note && <p style={{ color: "#777", fontSize: 12, lineHeight: 1.6 }}>{data.note}</p>}
    </div>
  );
}
