// src/components/ChartPage.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import IndexChart from "../components/indexChart";
import { useAllChartData } from "../hooks/useAllChartData";
import { chartParams } from "../constants/chartMeta"; // chartMeta.js에서 import
import useIsMobile from "../hooks/useIsMobile";
import ChartCategoryTabs from "./ChartCategoryTabs";

// 화면 밖 차트는 가까이 스크롤될 때 그린다 — 한 페이지에 recharts 차트 9~15개를 한꺼번에 그리면 메인 스레드가 1초 넘게 막힘.
// (2026-10-30) 첫 화면 2~4개만 즉시, 나머지는 자리(placeholder)만 잡아 두고 300px 앞에서 마운트.
function LazyMount({ children, minHeight = 520 }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (on || !ref.current || typeof IntersectionObserver === "undefined") { setOn(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { rootMargin: "300px 0px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [on]);
  return <div ref={ref} style={{ minHeight: on ? undefined : minHeight, width: "100%" }}>{on ? children : null}</div>;
}

const ChartPage = ({ chartType, title, envelop }) => {
  const isMobile = useIsMobile();

  const { processedData, loading, error } = useAllChartData(chartType);

  const envelope = envelop;
  const chartTypeList = Array.isArray(chartType) ? chartType : [chartType];

  const selectedList = chartTypeList.flatMap((type) => chartParams[type] || []);
  const [gridColumns, setGridColumns] = useState("1fr");

  const updateGridColumns = useCallback(() => {
    const width = window.innerWidth;
    if (width > 1900) {
      setGridColumns("repeat(4, 1fr)");
    } else if (width > 1400) {
      setGridColumns("repeat(3, 1fr)");
    } else if (width > 1000) {
      setGridColumns("repeat(2, 1fr)");
    } else {
      setGridColumns("1fr");
    }
  }, []);

  useEffect(() => {
    updateGridColumns();
    window.addEventListener("resize", updateGridColumns);
    return () => {
      window.removeEventListener("resize", updateGridColumns);
    };
  }, [updateGridColumns]);

  if (loading) return <p style={{ textAlign: "center", color: "var(--muted)", padding: 60 }}>시세 불러오는 중…</p>;
  if (error) return <p>❌ {error}</p>;

  return (

    <div style={{ padding: isMobile ? "12px 8px" : "40px", color: "#fff", background: "transparent", minHeight: "60vh" }}>
      {/* h1 은 pages/*.jsx 의 HubIntro(화면 밖 .sr-only 제목)가 맡음 → 여기는 h2. 분류 탭(환율·채권/지수/원자재)은 제목 옆. */}
      <div className="section-head" style={{ margin: "0 auto 6px", padding: 0, maxWidth: "none" }}>
        <div>
          <div className="kicker">MARKET CHARTS</div>
          <h2>{title}</h2>
        </div>
        <div className="section-aside"><ChartCategoryTabs /></div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: gridColumns, // 동적으로 설정된 gridTemplateColumns
          gap: isMobile ? "16px" : "40px",
          marginTop: isMobile ? "14px" : "40px",
        }}
      >
        {selectedList.map((index) => {
  const chartData = processedData[index.key];

  if (!chartData || !chartData.data || chartData.data.length === 0) return null;

  return (
    <div
      key={index.label}
      className="reveal tilt"
      style={{
        backgroundColor: "transparent",
        padding: isMobile ? "4px 0" : "20px",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: 0,
      }}
    >
      <LazyMount>
        <IndexChart
          dataName={index.label}
          processedData={chartData}
          envelope={envelope}
        />
      </LazyMount>
    </div>
  );
})}
      </div>
    </div>
  );
};

export default ChartPage;
