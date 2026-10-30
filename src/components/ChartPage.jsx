// src/components/ChartPage.jsx
// 시세 차트 페이지 — 종목 칩 줄(종가·등락 요약) + 누른 종목의 차트 1개만 바로 아래. (2026-10-30 사용자 요청: 전부 띄우지 않기)
// 분류 탭(환율·채권/지수/원자재)은 제목 옆. 선택은 URL 해시(#s=<key>)에 반영해 공유·새로고침 유지.
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import IndexChart from "../components/indexChart";
import { useAllChartData } from "../hooks/useAllChartData";
import { chartParams } from "../constants/chartMeta";
import useIsMobile from "../hooks/useIsMobile";
import ChartCategoryTabs from "./ChartCategoryTabs";
import { bandFor } from "../constants/chartBands";

const decFor = (v) => (Math.abs(v) >= 100 ? 2 : Math.abs(v) >= 10 ? 3 : 4);
const fmt = (v) => (typeof v === "number" && isFinite(v) ? v.toLocaleString("en-US", { minimumFractionDigits: decFor(v), maximumFractionDigits: decFor(v) }) : "-");

function lastDelta(arr) {
  const n = arr?.length || 0;
  if (n < 2) return null;
  const a = arr[n - 1]?.close, b = arr[n - 2]?.close;
  return typeof a === "number" && typeof b === "number" && b ? ((a - b) / b) * 100 : null;
}

const ChartPage = ({ chartType, title }) => {
  const isMobile = useIsMobile();
  const { processedData, loading, error } = useAllChartData(chartType);

  // 데이터가 있는 종목만, chartMeta 순서대로
  const items = useMemo(() => {
    const list = (Array.isArray(chartType) ? chartType : [chartType]).flatMap((type) => (chartParams[type] || []).map((it) => ({ ...it, cat: type })));
    return list
      .map((it) => ({ ...it, chart: processedData[it.key] }))
      .filter((it) => it.chart && Array.isArray(it.chart.data) && it.chart.data.length > 0);
  }, [processedData, chartType]);

  const [selected, setSelected] = useState(null);
  // 첫 진입: 해시(#s=key)가 있으면 그 종목, 없으면 첫 종목
  useEffect(() => {
    if (!items.length) return;
    const m = /[#&]s=([A-Za-z0-9_-]+)/.exec(typeof window !== "undefined" ? window.location.hash : "");
    const fromHash = m && items.find((it) => it.key === m[1]) ? m[1] : null;
    setSelected((p) => (p && items.find((it) => it.key === p) ? p : fromHash || items[0].key));
  }, [items]);
  const detailRef = useRef(null);
  const select = useCallback((key) => {
    setSelected(key);
    try { window.history.replaceState(null, "", `#s=${key}`); } catch { /* noop */ }
    // 차트가 화면 밖(아래)에 걸리면 살짝 끌어올린다 — 칩을 누른 손가락 위치에서 바로 보이게
    requestAnimationFrame(() => {
      const el = detailRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom > window.innerHeight || r.top < 60) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }, []);

  if (loading) return <p style={{ textAlign: "center", color: "var(--muted)", padding: 60 }}>시세 불러오는 중…</p>;
  if (error) return <p className="meta" style={{ padding: 40, textAlign: "center" }}>❌ {error}</p>;

  const cur = items.find((it) => it.key === selected) || items[0];

  return (
    <div style={{ padding: isMobile ? "12px 8px" : "28px 40px 40px", color: "var(--text)", minHeight: "60vh" }}>
      {/* h1 은 pages/*.jsx 의 HubIntro(화면 밖 .sr-only 제목)가 맡음 → 여기는 h2 */}
      <div className="section-head" style={{ margin: "0 auto 10px", padding: 0, maxWidth: "none" }}>
        <div>
          <div className="kicker">MARKET CHARTS</div>
          <h2>{title}</h2>
        </div>
        <div className="section-aside"><ChartCategoryTabs /></div>
      </div>

      {/* 종목 칩 — 누르면 아래에 그 차트 */}
      <div className="sym-strip" role="tablist" aria-label="종목 선택">
        {items.map((it) => {
          const last = it.chart.data[it.chart.data.length - 1];
          const d = lastDelta(it.chart.data);
          const tone = d == null ? "var(--muted)" : d > 0 ? "var(--up)" : d < 0 ? "var(--down)" : "var(--muted)";
          const on = cur && it.key === cur.key;
          return (
            <React.Fragment key={it.key}>
              <button type="button" role="tab" aria-selected={on} className={`sym-btn${on ? " is-on" : ""}`} onClick={() => select(it.key)}>
                <span className="nm">{isMobile ? it.label.replace(/^1 USD → /, "") : it.label}</span>
                <span className="val"><b>{fmt(last?.close)}</b><em style={{ color: tone }}>{d == null ? "" : `${d > 0 ? "+" : d < 0 ? "−" : ""}${Math.abs(d).toFixed(2)}%`}</em></span>
              </button>
              {/* 선택한 칩 바로 다음에 차트를 끼워 넣는다 — 격자는 grid-auto-flow: dense 라 같은 줄의 나머지 칸이 뒤 칩으로 채워지고,
                  차트(grid-column: 1/-1)는 그 줄 바로 아래에 온다. 칩을 아무리 많이 띄워도 차트는 누른 자리 근처. */}
              {on && (
                <div className="sym-detail" ref={detailRef}>
                  <IndexChart dataName={it.label} processedData={it.chart} band={bandFor(it.cat)} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      {!items.length && <p className="meta" style={{ padding: 40, textAlign: "center" }}>표시할 종목이 없습니다.</p>}
    </div>
  );
};

export default ChartPage;
