// 차트 라우트용 서버렌더 요약 블록 — dynamic(ssr:false) 대시보드 위에 두어 JS 없이 읽는 크롤러·AI에게
// 페이지 제목(h1)·설명·최근 종가 목록을 텍스트로 준다. 시각적으로는 유리 띠(.seo-summary, system.css). (2026-09-30, 2026-10-25 통일)
// 페이지의 유일한 h1 이 여기다: ChartPage·HomeHero 의 제목은 h2 로 내렸다(스타일 동일).
// children: 같은 띠 안에 이어 붙일 서버렌더 링크 묶음(홈의 TodayLinks 등).
import React from "react";

function fmtClose(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  const a = Math.abs(n);
  const dec = a >= 1000 ? 1 : a >= 10 ? 2 : 4;
  return n.toLocaleString("ko-KR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export default function SeoSummary({ title, paragraphs = [], rows = [], rowsTitle = "최근 종가", children }) {
  return (
    <section aria-label="페이지 요약" className="seo-summary">
      <h1>{title}</h1>
      {paragraphs.map((t, i) => (
        <p key={i}>{t}</p>
      ))}
      {rows.length > 0 && (
        <>
          <p className="meta" style={{ margin: "6px 0 0" }}>
            {rowsTitle} (종목 · 종가 · 기준일 · 100일 이동평균 대비)
          </p>
          <ul className="plain">
            {rows.map((r) => (
              <li key={r.key}>
                {r.label} {fmtClose(r.close)} ({r.date}){r.vsMa100 != null ? ` MA100 ${r.vsMa100 > 0 ? "+" : ""}${r.vsMa100}%` : ""}
              </li>
            ))}
          </ul>
        </>
      )}
      {children}
    </section>
  );
}
