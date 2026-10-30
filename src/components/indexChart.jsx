// 일봉 시세 카드 — 종가·100일 이평선·엔벨로프(±3%/±10%) 선 차트 + 커서 위치 읽기표.
// 2026-10-30 디자인 시스템(Panel·토큰)으로 통일: 선 색은 theme.js(종가 cyan, 이평선 보라 점선, 상단 밴드 --up, 하단 밴드 --down),
//   격자 실선 헤어라인, 글자는 텍스트 토큰, 등락은 --up/--down(국내 관례). 카드 테두리 색 = 이평선 대비 위치(위 up / 아래 down).
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import 'dayjs/locale/ko';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import Panel from "./ui/Panel";
import { COLOR } from "../lib/theme";

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("ko");

const LINE_CLOSE = COLOR.cyan;
const LINE_MA = COLOR.accent2;
const chartLinesConfig = {
  10: [
    { dataKey: "envelope10_upper", stroke: COLOR.up },
    { dataKey: "envelope10_lower", stroke: COLOR.down },
  ],
  3: [
    { dataKey: "envelope3_upper", stroke: COLOR.up },
    { dataKey: "envelope3_lower", stroke: COLOR.down },
  ],
};

// getLabelMap은 컴포넌트 외부에 정의해 매 렌더마다 재생성 방지
function getLabelMap(data) {
  const firstDaysByMonth = {};
  const firstDaysByYear = {};
  for (let i = 0; i < data.length; i++) {
    const d = dayjs(data[i].date);
    const monthKey = `${d.year()}-${d.month()}`;
    const yearKey = `${d.year()}`;
    if (!firstDaysByMonth[monthKey]) firstDaysByMonth[monthKey] = d.format("YYYY-MM-DD");
    if (!firstDaysByYear[yearKey]) firstDaysByYear[yearKey] = d.format("YYYY-MM-DD");
  }
  return { firstDaysByMonth, firstDaysByYear };
}

// 값 크기에 맞춘 소수 자릿수 — 유로 0.90·홍콩달러 7.85 같은 작은 값이 "▼ 0.00" 으로 뭉개지지 않게
const decFor = (v) => (typeof v === "number" && isFinite(v) ? (Math.abs(v) >= 100 ? 2 : Math.abs(v) >= 10 ? 3 : 4) : 2);
const safeFixed = (v, d = 2) => (typeof v === "number" && isFinite(v) ? v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }) : "-");
const signed = (v, d = 2, suffix = "") => (typeof v === "number" && isFinite(v) ? `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })}${suffix}` : "-");
const toneOf = (v) => (v > 0 ? "var(--up)" : v < 0 ? "var(--down)" : "var(--muted)");

function Row({ swatch, dash, label, value, tone, strong }) {
  return (
    <div className="qrow">
      <span className="qlab">
        {swatch && <i style={{ background: dash ? "transparent" : swatch, borderTop: dash ? `2px dashed ${swatch}` : undefined }} />}
        {label}
      </span>
      <b style={{ color: tone || "var(--text)", fontWeight: strong ? 800 : 600 }}>{value}</b>
    </div>
  );
}

function IndexChart({ processedData, dataName, envelope }) {
  const processedTime = processedData?.processed_time;
  const howLongAgo = processedTime ? dayjs.utc(processedTime).tz("Asia/Seoul").fromNow() : "";
  const data = processedData.data;

  // ── 모든 Hook은 early return 앞에 위치해야 함 (Rules of Hooks) ──
  const lastItem = data?.length ? data[data.length - 1] : null;
  const [customTooltip, setCustomTooltip] = useState(null);
  const { firstDaysByMonth, firstDaysByYear } = useMemo(() => getLabelMap(data || []), [data]);
  const chartLines = useMemo(() => [
    { dataKey: "close", stroke: LINE_CLOSE, strokeWidth: 2 },
    { dataKey: "ma100", stroke: LINE_MA, strokeWidth: 1.5, dash: "4 3" },
    ...(chartLinesConfig[envelope]?.map((line) => ({ ...line, strokeWidth: 1.25 })) || []),
  ], [envelope]);

  const readoutAt = useCallback((item, label) => ({
    label,
    payload: chartLines.map(({ dataKey, stroke }) => ({ dataKey, value: item?.[dataKey], color: stroke })),
  }), [chartLines]);

  useEffect(() => {
    if (!data?.length) return;
    const last = data[data.length - 1];
    setCustomTooltip((prev) => prev ?? readoutAt(last, last.date));
  }, [data, readoutAt]);

  const handleMouseMove = useCallback((e) => {
    if (!e?.isTooltipActive || !e?.activePayload?.length) return;
    const byKey = Object.fromEntries(e.activePayload.map((p) => [p.dataKey, p.value]));
    setCustomTooltip(readoutAt(byKey, e.activeLabel));
  }, [readoutAt]);

  const handleMouseLeave = useCallback(() => {
    if (lastItem) setCustomTooltip(readoutAt(lastItem, lastItem.date));
  }, [lastItem, readoutAt]);

  // ── Hook 이후에 early return ──
  if (!data?.length) return <p className="meta">차트 데이터 없음</p>;

  const close = lastItem?.close ?? 0;
  const ma100 = lastItem?.ma100;
  const aboveMa = ma100 != null ? close >= ma100 : true;
  const prevClose = data.length >= 2 ? (data[data.length - 2]?.close ?? close) : close;
  const diffValue = close - prevClose;
  const diffPct = prevClose > 0 ? (diffValue / prevClose) * 100 : 0;
  const diffTone = toneOf(diffValue);
  const dec = decFor(close);

  const formatXAxis = (tickItem) => {
    const date = dayjs(tickItem);
    const key = date.format("YYYY-MM-DD");
    if (firstDaysByYear[`${date.year()}`] === key) return date.format("YY/MM");
    if (firstDaysByMonth[`${date.year()}-${date.month()}`] === key) return date.format("MM");
    return "";
  };

  // 읽기표 값
  const p = customTooltip?.payload || [];
  const vClose = p[0]?.value, vMa = p[1]?.value, vUp = p[2]?.value, vLow = p[3]?.value;
  const dMa = (typeof vClose === "number" && typeof vMa === "number") ? vClose - vMa : null;
  const dMaPct = (dMa != null && vMa) ? (dMa / vMa) * 100 : null;
  const accent = aboveMa ? "var(--up)" : "var(--down)";

  return (
    <Panel
      as="article"
      className="qcard"
      title={dataName}
      meta={howLongAgo ? `갱신 ${howLongAgo}` : ""}
      badge={
        <span className="qdelta" style={{ color: diffTone }}>
          <b>{safeFixed(close, dec)}</b>
          <span>{diffValue >= 0 ? "▲" : "▼"} {safeFixed(Math.abs(diffValue), dec)} ({signed(diffPct, 2, "%")})</span>
        </span>
      }
      pad={0}
      style={{ borderColor: `color-mix(in srgb, ${accent} 45%, transparent)` }}
    >
      <div style={{ width: "100%", height: 230, padding: "10px 8px 0 0" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="rgba(148,163,255,0.10)" />
            <XAxis dataKey="date" ticks={Object.values(firstDaysByMonth)} tickFormatter={formatXAxis}
              tick={{ fill: COLOR.muted, fontSize: 11 }} axisLine={{ stroke: "rgba(148,163,255,0.16)" }} tickLine={false} />
            <YAxis domain={["auto", "auto"]} tick={{ fill: COLOR.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={58}
              tickFormatter={(v) => (Math.abs(v) >= 10000 ? `${(v / 1000).toFixed(0)}k` : Math.abs(v) >= 100 ? Math.round(v) : v)} />
            {chartLines.map(({ dataKey, stroke, strokeWidth, dash }) => (
              <Line key={dataKey} type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={strokeWidth}
                strokeDasharray={dash} dot={false} isAnimationActive={false} activeDot={dataKey === "close" ? { r: 4, stroke: "#05060f", strokeWidth: 2 } : false} />
            ))}
            {/* cursor 표시만 위해 Tooltip 유지 (content는 아래 읽기표에서 처리) */}
            <Tooltip cursor={{ stroke: "rgba(238,242,255,0.35)", strokeWidth: 1 }} content={() => null} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {customTooltip && (
        <div className="qread">
          <div className="qdate">{dayjs(customTooltip.label).format("M/D (dd)")}<span className="meta"> · 차트 위에서 날짜를 움직여 보세요</span></div>
          <div className="qgrid">
            <Row swatch={LINE_CLOSE} label="종가" value={safeFixed(vClose, dec)} strong />
            <Row swatch={LINE_MA} dash label="이평선 100일" value={safeFixed(vMa, dec)} />
            <Row label="이평선 대비" value={`${signed(dMa, dec)} (${signed(dMaPct, 2, "%")})`} tone={toneOf(dMa ?? 0)} strong />
            <Row swatch={COLOR.up} label={`이평선 +${envelope}%`} value={safeFixed(vUp, dec)} />
            <Row swatch={COLOR.down} label={`이평선 −${envelope}%`} value={safeFixed(vLow, dec)} />
          </div>
        </div>
      )}
    </Panel>
  );
}

export default IndexChart;
