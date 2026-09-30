// 차트 라우트용 서버렌더 요약 블록 — dynamic(ssr:false) 대시보드 위에 두어 JS 없이 읽는 크롤러·AI에게
// 페이지 제목(h1)·설명·최근 종가 목록을 텍스트로 준다. 시각적으로는 작은 안내문(테마 변수 사용). (2026-09-30)
// 페이지의 유일한 h1 이 여기다: ChartPage·HomeHero 의 제목은 h2 로 내렸다(스타일 동일).
import React from "react";

const wrap = {
  maxWidth: 1400,
  margin: "0 auto",
  padding: "14px 16px 0",
  color: "var(--text-2)",
  fontSize: 13,
  lineHeight: 1.7,
};
const h1 = { color: "var(--text)", fontSize: 18, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.01em" };
const p = { margin: "0 0 6px" };
const ul = { listStyle: "none", padding: 0, margin: "4px 0 0", display: "flex", flexWrap: "wrap", gap: "2px 14px", color: "var(--muted)", fontSize: 12 };

function fmtClose(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  const a = Math.abs(n);
  const dec = a >= 1000 ? 1 : a >= 10 ? 2 : 4;
  return n.toLocaleString("ko-KR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export default function SeoSummary({ title, paragraphs = [], rows = [], rowsTitle = "최근 종가" }) {
  return (
    <section aria-label="페이지 요약" style={wrap}>
      <h1 style={h1}>{title}</h1>
      {paragraphs.map((t, i) => (
        <p key={i} style={p}>{t}</p>
      ))}
      {rows.length > 0 && (
        <>
          <p style={{ ...p, color: "var(--muted)", fontSize: 12, margin: "6px 0 0" }}>
            {rowsTitle} (종목 · 종가 · 기준일 · 100일 이동평균 대비)
          </p>
          <ul style={ul}>
            {rows.map((r) => (
              <li key={r.key}>
                {r.label} {fmtClose(r.close)} ({r.date}){r.vsMa100 != null ? ` MA100 ${r.vsMa100 > 0 ? "+" : ""}${r.vsMa100}%` : ""}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
