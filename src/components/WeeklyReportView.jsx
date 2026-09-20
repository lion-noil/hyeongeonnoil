// 주간 보고서 네이티브 뷰 — report.data(JSON: 셀별 판정)로 그린다. 마크다운은 전체 텍스트로 아래에 접어 둔다.
// data 스키마: News_scrap/app/weekly_report.py to_data()  { accounts[], cells[], grade_counts, trend_labels, ... }
import { useMemo, useState } from "react";

const GRADES = ["점검", "주의", "관찰", "정상"];
const ICON = { 점검: "🔧", 주의: "🟠", 관찰: "👀", 정상: "✅" };
const GRADE_COLOR = { 점검: "#ffb347", 주의: "#ff7f50", 관찰: "#ffd479", 정상: "#00ffcc" };
const ACCOUNT_KO = { BYBIT: "코인", MT5: "CFD" };

const card = { background: "#242424", borderRadius: 10, padding: "14px 16px", marginBottom: 12 };
const chip = (on, color = "#00ffcc") => ({
  display: "inline-block", padding: "4px 10px", marginRight: 6, marginBottom: 6, borderRadius: 14, fontSize: 13,
  cursor: "pointer", userSelect: "none",
  color: on ? "#111" : color, background: on ? color : "transparent", border: `1px solid ${color}`,
});

const f1 = (v) => (v == null ? "" : `${v > 0 ? "+" : ""}${Number(v).toFixed(1)}`);
const pct = (v) => (v == null ? "" : `${Number(v).toFixed(0)}%`);

function statLine(c) {
  const t = c.this || {};
  let s;
  if (t.exits) s = `${t.exits}건 ${pct(t.win_rate)} ${f1(t.sum_pct)}%p`;
  else if (t.entries) s = `진입 ${t.entries} · 청산 0`;
  else s = c.streak ? `무진입 ${c.streak}주` : "거래 없음";
  if (t.open) s += ` · 미청산 ${t.open}`;
  return s;
}

function CellCard({ c }) {
  const color = GRADE_COLOR[c.grade] || "#888";
  const m = c.mtd || {};
  const r = c.recent || {};
  return (
    <div style={{ ...card, borderLeft: `3px solid ${color}`, padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>
          {ICON[c.grade] || "▫️"} {c.symbol} <span style={{ color: "#9bd" }}>{c.book} {c.tag}</span>
          <span style={{ color: "#777", fontSize: 12, marginLeft: 8 }}>{ACCOUNT_KO[c.account] || c.account} · {c.strategy}</span>
        </span>
        <span style={{ color, fontSize: 13 }}>{statLine(c)}</span>
      </div>
      {c.reason && <div style={{ color: "#ddd", fontSize: 14, lineHeight: 1.6, marginTop: 6 }}>{c.reason}</div>}
      {c.action && c.action !== "없음" && (
        <div style={{ color, fontSize: 13, marginTop: 4 }}>→ {c.action}</div>
      )}
      <div style={{ color: "#777", fontSize: 12, marginTop: 6 }}>
        4주 {f1(r.sum_pct)}%p({r.exits ?? 0}) · 월누적 {f1(m.sum_pct)}%p({m.exits ?? 0}
        {m.win_rate != null ? `, ${pct(m.win_rate)}` : ""})
        {c.mtd_flag ? ` · ${c.mtd_flag}` : ""}
        {c.expected_pct != null ? ` · 기대 ${f1(c.expected_pct)}%` : ""}
      </div>
    </div>
  );
}

export default function WeeklyReportView({ data }) {
  const [acct, setAcct] = useState("ALL");
  const [grade, setGrade] = useState("ALL");
  const cells = data?.cells || [];
  const accounts = data?.accounts || [];
  const counts = data?.grade_counts || {};
  const graded = cells.some((c) => c.grade);

  const shown = useMemo(
    () => cells.filter((c) => (acct === "ALL" || c.account === acct) && (grade === "ALL" || c.grade === grade)),
    [cells, acct, grade],
  );
  const hot = shown.filter((c) => c.grade === "점검" || c.grade === "주의");
  const rest = shown.filter((c) => !(c.grade === "점검" || c.grade === "주의"));

  return (
    <div>
      {/* 한눈에 */}
      <div style={card}>
        <div style={{ color: "#00ffcc", fontWeight: 600, marginBottom: 8 }}>한눈에</div>
        {accounts.map((a) => {
          const t = a.this || {};
          const money = a.has_money ? ` · 실현 ${t.realized > 0 ? "+" : ""}${Number(t.realized).toFixed(2)} ${a.currency}` : "";
          const arrow = (a.trend || []).slice().reverse().map((x) => f1(x.sum_pct)).join(" → ");
          return (
            <div key={a.account} style={{ fontSize: 14, lineHeight: 1.7 }}>
              <b>{a.name}</b>: 진입 {t.entries} · 청산 {t.exits}건{t.win_rate != null ? ` · 승률 ${pct(t.win_rate)}` : ""} · 합계 {f1(t.sum_pct)}%p{money}
              <span style={{ color: "#777", fontSize: 12 }}> · 4주 {arrow}</span>
            </div>
          );
        })}
        <div style={{ marginTop: 8, fontSize: 13, color: "#bbb" }}>
          {graded
            ? GRADES.map((g) => <span key={g} style={{ marginRight: 12 }}>{ICON[g]} {g} <b style={{ color: GRADE_COLOR[g] }}>{counts[g] ?? 0}</b></span>)
            : "판정 없음(평가 생략)"}
          <span style={{ color: "#666" }}>셀 {cells.length}{data.llm ? ` · 평가 ${data.llm}` : ""}</span>
        </div>
      </div>

      {/* 필터 */}
      <div style={{ marginBottom: 6 }}>
        <span style={chip(acct === "ALL")} onClick={() => setAcct("ALL")}>전체 계좌</span>
        {accounts.map((a) => (
          <span key={a.account} style={chip(acct === a.account)} onClick={() => setAcct(a.account)}>{a.name}</span>
        ))}
      </div>
      {graded && (
        <div style={{ marginBottom: 10 }}>
          <span style={chip(grade === "ALL", "#bbb")} onClick={() => setGrade("ALL")}>전체 판정</span>
          {GRADES.map((g) => (
            <span key={g} style={chip(grade === g, GRADE_COLOR[g])} onClick={() => setGrade(grade === g ? "ALL" : g)}>
              {ICON[g]} {g} {counts[g] ?? 0}
            </span>
          ))}
        </div>
      )}

      {/* 지금 볼 것 */}
      {graded && grade !== "관찰" && grade !== "정상" && (
        <>
          <h2 style={{ color: "#ff9f5a", fontSize: 17, margin: "14px 0 8px" }}>지금 볼 것 <span style={{ color: "#777", fontSize: 13 }}>{hot.length}</span></h2>
          {hot.length ? hot.map((c) => <CellCard key={c.key} c={c} />) : <div style={{ ...card, color: "#888" }}>없음 — 점검·주의 셀 없음</div>}
        </>
      )}

      {/* 총평 */}
      {accounts.some((a) => a.summary) && grade === "ALL" && (
        <div style={card}>
          <div style={{ color: "#00ffcc", fontWeight: 600, marginBottom: 6 }}>총평</div>
          {accounts.filter((a) => a.summary && (acct === "ALL" || a.account === acct)).map((a) => (
            <p key={a.account} style={{ fontSize: 14, lineHeight: 1.7, margin: "6px 0" }}><b>{a.name}</b>: {a.summary}</p>
          ))}
        </div>
      )}

      {/* 관찰·정상 */}
      {rest.length > 0 && (grade === "ALL" || grade === "관찰" || grade === "정상" || !graded) && (
        <>
          <h2 style={{ color: "#00ffcc", fontSize: 17, margin: "14px 0 8px" }}>
            {graded ? "관찰 · 정상 셀" : "셀 목록"} <span style={{ color: "#777", fontSize: 13 }}>{rest.length}</span>
          </h2>
          {rest.map((c) => <CellCard key={c.key} c={c} />)}
        </>
      )}
    </div>
  );
}
