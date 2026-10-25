// 외부 재현 검증(QuantConnect 독립 백테스트) 자체 호스팅 뷰 — /verified 와 보고서(verify:<label>) 공용. (2026-10-25)
// 데이터: src/data/qc_backtest.json 또는 report.data (kind=qc_backtest) — reversion_research/platforms/quantconnect/build_verified_data.py 가 만든다.
// 공개 임베드(quantconnect.cloud)에 의존하지 않고 자본곡선·낙폭·월별·심볼별·셀별 표를 직접 그린다.
// 차트 규칙(dataviz): 한 축만, 2px 선 + 10% 워시, 실선 헤어라인 격자, 단일 시리즈라 범례 없음, 호버 십자선 툴팁, 표 뷰 병행.
import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import Panel, { Chip } from "./ui/Panel";
import { COLOR } from "../lib/theme";

const fmtUsd = (v) => `$${Math.round(v).toLocaleString("en-US")}`;
const fmtPct = (v, d = 1) => (v == null ? "—" : `${v > 0 ? "+" : ""}${Number(v).toFixed(d)}%`);
const MONTHS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

// 월별 수익률 → 셀 배경. 양수 = --up(빨강), 음수 = --down(파랑), 0 근처 = 중립 회색. 크기는 투명도로.
function cellBg(ret, maxAbs) {
  if (ret == null) return "transparent";
  const a = Math.min(1, Math.abs(ret) / (maxAbs || 1));
  if (Math.abs(ret) < 0.05) return "rgba(148,163,255,0.08)";
  const alpha = 0.12 + a * 0.55;
  return ret > 0 ? `rgba(255,107,122,${alpha.toFixed(2)})` : `rgba(94,179,255,${alpha.toFixed(2)})`;
}

function StatTile({ label, value, sub, tone }) {
  return (
    <div className="inset" style={{ padding: "12px 14px", minWidth: 0 }}>
      <div className="meta" style={{ marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: tone || "var(--text)", lineHeight: 1.1 }}>{value}</div>
      {sub && <div className="meta" style={{ marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="inset" style={{ padding: "8px 10px", background: "rgba(6,10,20,0.95)", fontSize: "var(--fs-xs)", color: "var(--text-2)" }}>
      <div style={{ color: "var(--text)", fontWeight: 700, marginBottom: 2 }}>{label}</div>
      <div>자본 <b style={{ color: "var(--text)" }}>{fmtUsd(p.equity)}</b></div>
      <div>누적 <b style={{ color: "var(--text)" }}>{fmtPct(p.ret)}</b> · 낙폭 <b style={{ color: "var(--text)" }}>{p.dd.toFixed(1)}%</b></div>
    </div>
  );
}

export default function QcBacktestView({ data, caveats = [], expectation = "", compact = false }) {
  const [tab, setTab] = useState("chart");
  const s = data?.stats || {};
  const meta = data?.meta || {};
  const rows = useMemo(() => (data?.equity || []).map(([d, eq, dd]) => ({
    d, equity: eq, dd, ret: s.start_equity ? (eq / s.start_equity - 1) * 100 : 0,
  })), [data, s.start_equity]);
  const yearTicks = useMemo(() => {
    const seen = new Set(); const out = [];
    rows.forEach((r) => { const y = r.d.slice(0, 4); if (!seen.has(y)) { seen.add(y); out.push(r.d); } });
    return out;
  }, [rows]);
  // 낙폭 축: 최저 낙폭을 5% 단위로 내림한 값까지, 눈금은 5% 간격 (−5.19% 같은 자동 눈금 방지)
  const ddFloor = useMemo(() => -Math.max(5, Math.ceil(Math.max(0, ...rows.map((r) => -r.dd)) / 5) * 5), [rows]);
  const ddTicks = useMemo(() => { const t = []; for (let v = 0; v >= ddFloor; v -= 5) t.push(v); return t; }, [ddFloor]);
  const monthly = data?.monthly || [];
  const byYear = useMemo(() => {
    const m = {};
    monthly.forEach((x) => { const [y, mo] = x.ym.split("-"); (m[y] ||= {})[Number(mo)] = x.ret; });
    return m;
  }, [monthly]);
  const maxAbs = useMemo(() => Math.max(1, ...monthly.map((x) => Math.abs(x.ret))), [monthly]);
  const ms = data?.monthly_summary || {};
  const years = Object.keys(byYear).sort();
  const yearly = Object.fromEntries((data?.yearly || []).map((y) => [y.year, y]));
  if (!data) return null;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* 핵심 숫자 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
        <StatTile label="순이익 (5년)" value={fmtPct(s.net_profit_pct, 1)} sub={`${fmtUsd(s.start_equity)} → ${fmtUsd(s.end_equity)}`} tone="var(--up)" />
        <StatTile label="연복리 수익률" value={fmtPct(s.cagr_pct, 1)} sub="CAGR" />
        <StatTile label="최대 낙폭" value={`−${Number(s.max_dd_pct).toFixed(1)}%`} sub={s.dd_recovery_days ? `회복 ${s.dd_recovery_days}일` : ""} tone="var(--down)" />
        <StatTile label="샤프 / 소르티노" value={`${s.sharpe} / ${s.sortino}`} sub={s.psr_pct != null ? `확률적 샤프 ${s.psr_pct.toFixed(1)}%` : ""} />
        <StatTile label="승률" value={`${Math.round(s.win_rate_pct)}%`} sub={`청산 ${s.closed_trades}건 · 손익비 ${s.pl_ratio}`} />
        <StatTile label="주문 수" value={s.orders?.toLocaleString("en-US")} sub={`수수료 $${s.fees ?? 0} (스프레드만)`} />
      </div>

      {/* 자본곡선 + 낙폭 */}
      <Panel icon="📈" title="자본곡선" meta={`${meta.start} ~ ${meta.end} · 거래일 ${meta.tradeable_days}일 · 일 1점`} pad={compact ? 10 : 14}
        badge={
          <div style={{ display: "flex", gap: 6 }}>
            {[["chart", "차트"], ["table", "월별 표"]].map(([k, l]) => (
              <button key={k} type="button" onClick={() => setTab(k)} className="chip"
                style={{ cursor: "pointer", font: "inherit", fontSize: "var(--fs-xs)", fontWeight: 700,
                  color: tab === k ? "#05060f" : "var(--text-2)", background: tab === k ? "var(--accent)" : undefined, borderColor: tab === k ? "var(--accent)" : undefined }}>
                {l}
              </button>
            ))}
          </div>
        }
      >
        {tab === "chart" ? (
          <>
            <div style={{ width: "100%", height: compact ? 220 : 300 }}>
              <ResponsiveContainer>
                <ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="qcEq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLOR.cyan} stopOpacity={0.22} />
                      <stop offset="100%" stopColor={COLOR.cyan} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(148,163,255,0.10)" />
                  <XAxis dataKey="d" ticks={yearTicks} tickFormatter={(d) => d.slice(0, 4)} tick={{ fill: COLOR.muted, fontSize: 11 }} axisLine={{ stroke: "rgba(148,163,255,0.16)" }} tickLine={false} minTickGap={20} />
                  <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tick={{ fill: COLOR.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={48} domain={["dataMin - 5000", "dataMax + 5000"]} />
                  <Tooltip content={<ChartTip />} cursor={{ stroke: "rgba(238,242,255,0.35)", strokeWidth: 1 }} />
                  <ReferenceLine y={s.start_equity} stroke="rgba(148,163,255,0.3)" />
                  <Area type="monotone" dataKey="equity" stroke="none" fill="url(#qcEq)" isAnimationActive={false} />
                  <Line type="monotone" dataKey="equity" stroke={COLOR.cyan} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: "#05060f", strokeWidth: 2 }} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="meta" style={{ margin: "6px 0 2px 48px" }}>고점 대비 낙폭</div>
            <div style={{ width: "100%", height: compact ? 70 : 90 }}>
              <ResponsiveContainer>
                <ComposedChart data={rows} margin={{ top: 2, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(148,163,255,0.10)" />
                  <XAxis dataKey="d" ticks={yearTicks} tickFormatter={(d) => d.slice(0, 4)} tick={{ fill: COLOR.muted, fontSize: 11 }} axisLine={{ stroke: "rgba(148,163,255,0.16)" }} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: COLOR.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={48} domain={[ddFloor, 0]} ticks={ddTicks} />
                  <Tooltip content={<ChartTip />} cursor={{ stroke: "rgba(238,242,255,0.35)", strokeWidth: 1 }} />
                  <Area type="step" dataKey="dd" stroke={COLOR.down} strokeWidth={1.5} fill={COLOR.down} fillOpacity={0.14} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "var(--fs-xs)", fontVariantNumeric: "tabular-nums" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "4px 6px", color: "var(--muted)", fontWeight: 600 }}>연도</th>
                  {MONTHS.map((m) => <th key={m} style={{ padding: "4px 2px", color: "var(--muted)", fontWeight: 600 }}>{m}월</th>)}
                  <th style={{ padding: "4px 6px", color: "var(--muted)", fontWeight: 600 }}>연간</th>
                </tr>
              </thead>
              <tbody>
                {years.map((y) => (
                  <tr key={y}>
                    <td style={{ padding: "3px 6px", color: "var(--text)", fontWeight: 700 }}>{y}</td>
                    {MONTHS.map((m) => {
                      const v = byYear[y][Number(m)];
                      return (
                        <td key={m} title={v == null ? "" : `${y}-${m.padStart(2, "0")} ${fmtPct(v, 2)}`}
                          style={{ padding: "5px 2px", textAlign: "center", background: cellBg(v, maxAbs), color: v == null ? "var(--muted)" : "var(--text)", borderRadius: 4, border: "2px solid var(--panel-solid)" }}>
                          {v == null ? "·" : fmtPct(v, 1).replace("%", "")}
                        </td>
                      );
                    })}
                    <td style={{ padding: "3px 6px", textAlign: "right", fontWeight: 700, color: (yearly[y]?.ret ?? 0) >= 0 ? "var(--up)" : "var(--down)" }}>{fmtPct(yearly[y]?.ret, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="meta" style={{ marginTop: 8 }}>단위 %. 빨강 = 플러스 달, 파랑 = 마이너스 달(국내 등락 관례). 연간은 월 복리 합산. 2026년은 7월 20일까지.</div>
          </div>
        )}
      </Panel>

      {/* 월별 분포 요약 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
        <StatTile label="플러스 달" value={`${ms.positive}/${ms.n}`} sub={`월 ${Math.round((ms.positive / ms.n) * 100)}% 확률`} />
        <StatTile label="월 중앙값 / 평균" value={`${fmtPct(ms.median, 2)}`} sub={`평균 ${fmtPct(ms.mean, 2)} — 평균이 크면 몇 달에 몰린 것`} />
        <StatTile label="최고 / 최악의 달" value={fmtPct(ms.best, 1)} sub={`최악 ${fmtPct(ms.worst, 1)}`} />
        <StatTile label="상위 5개월 비중" value={`${ms.top5_share_pct}%`} sub="전체 월 수익 합 중" tone="var(--warn)" />
      </div>

      {/* 심볼별 */}
      <Panel icon="💱" title="통화쌍별 청산 거래" meta={`청산 ${s.closed_trades}건 · 손익은 달러`} pad={0}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "var(--fs-sm)", fontVariantNumeric: "tabular-nums" }}>
            <thead>
              <tr style={{ color: "var(--muted)", fontSize: "var(--fs-xs)" }}>
                {["통화쌍", "거래", "롱/숏", "승률", "총손익", "건당"].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 0 ? "left" : "right", padding: "8px 12px", borderBottom: "1px solid var(--line)", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.symbols || []).map((r) => {
                const w = Math.abs(r.pnl) / Math.max(1, ...data.symbols.map((x) => Math.abs(x.pnl)));
                return (
                  <tr key={r.sym}>
                    <td style={{ padding: "7px 12px", borderBottom: "1px solid var(--line)", fontWeight: 700 }}>{r.sym}</td>
                    <td style={{ padding: "7px 12px", borderBottom: "1px solid var(--line)", textAlign: "right" }}>{r.trades}</td>
                    <td style={{ padding: "7px 12px", borderBottom: "1px solid var(--line)", textAlign: "right", color: "var(--text-2)" }}>{r.long}/{r.short}</td>
                    <td style={{ padding: "7px 12px", borderBottom: "1px solid var(--line)", textAlign: "right" }}>{r.win_rate}%</td>
                    <td style={{ padding: "7px 12px", borderBottom: "1px solid var(--line)", textAlign: "right" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                        <span style={{ width: 70, height: 6, borderRadius: 3, background: "rgba(148,163,255,0.10)", overflow: "hidden", display: "inline-block" }}>
                          <span style={{ display: "block", width: `${w * 100}%`, height: "100%", background: r.pnl >= 0 ? "var(--up)" : "var(--down)" }} />
                        </span>
                        <b style={{ color: r.pnl >= 0 ? "var(--up)" : "var(--down)", minWidth: 68, textAlign: "right" }}>{r.pnl >= 0 ? "+" : "−"}${Math.abs(r.pnl).toLocaleString("en-US")}</b>
                      </span>
                    </td>
                    <td style={{ padding: "7px 12px", borderBottom: "1px solid var(--line)", textAlign: "right", color: "var(--text-2)" }}>{r.avg_pnl >= 0 ? "+" : "−"}${Math.abs(r.avg_pnl)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* 셀별 QC vs 자체 엔진 */}
      {data.cell_rows?.length > 0 && (
        <Panel icon="🧪" title="셀별 대조 — QuantConnect vs 자체 엔진" meta="같은 규칙을 두 엔진·두 데이터로 돌린 거래 건수와 건당 수익" pad={0}
          footer={<span className="meta">건수 비율이 0.9~1.1 안이면 규칙 이식이 외부에서 재현된 것으로 봅니다. 건당%는 진입가 대비 평균 수익(수수료 전).</span>}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "var(--fs-sm)", fontVariantNumeric: "tabular-nums" }}>
              <thead>
                <tr style={{ color: "var(--muted)", fontSize: "var(--fs-xs)" }}>
                  {["#", "셀", "QC 건수", "엔진 건수", "비율", "QC 건당%", "엔진 건당%", "QC 합계%", "TP/SL/시간"].map((h, i) => (
                    <th key={h} style={{ textAlign: i <= 1 ? "left" : "right", padding: "8px 10px", borderBottom: "1px solid var(--line)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.cell_rows.map((c) => {
                  const ratio = c.eng_n ? c.qc_n / c.eng_n : 0;
                  const ok = ratio >= 0.9 && ratio <= 1.1;
                  const td = { padding: "6px 10px", borderBottom: "1px solid var(--line)", textAlign: "right", whiteSpace: "nowrap" };
                  return (
                    <tr key={c.idx}>
                      <td style={{ ...td, textAlign: "left", color: "var(--muted)" }}>{c.idx}</td>
                      <td style={{ ...td, textAlign: "left", fontWeight: 600 }}>{c.cell}</td>
                      <td style={td}>{c.qc_n}</td>
                      <td style={td}>{c.eng_n}</td>
                      <td style={td}><Chip color={ok ? COLOR.ok : COLOR.warn}>{ratio.toFixed(2)}</Chip></td>
                      <td style={td}>{c.qc_avg.toFixed(3)}</td>
                      <td style={td}>{c.eng_avg.toFixed(3)}</td>
                      <td style={{ ...td, color: c.qc_sum >= 0 ? "var(--up)" : "var(--down)" }}>{fmtPct(c.qc_sum, 1)}</td>
                      <td style={{ ...td, color: "var(--text-2)" }}>{c.exits}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* 정직한 해석 */}
      {caveats.length > 0 && (
        <Panel icon="⚠️" title="숫자를 그대로 믿으면 안 되는 이유" pad={16}>
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.75, fontSize: "var(--fs-md)", color: "var(--text-2)" }}>
            {caveats.map((c, i) => <li key={i} style={{ margin: "4px 0" }}>{c}</li>)}
          </ol>
          {expectation && (
            <p style={{ margin: "12px 0 0", fontSize: "var(--fs-md)", lineHeight: 1.7 }}>
              <b style={{ color: "var(--warn)" }}>{expectation}.</b> 이 백테스트는 "규칙이 외부 엔진·외부 데이터에서 재현된다"는 증거이지 앞으로의 수익 약속이 아닙니다.
            </p>
          )}
        </Panel>
      )}

      <div className="meta">
        원본: QuantConnect 프로젝트 {meta.project} · 백테스트 {meta.backtest_name} ({meta.backtest_id?.slice(0, 8)}) · {meta.engine} · {meta.node} · 실행 {String(meta.created || "").slice(0, 10)} · API로 내려받음 {String(meta.fetched_at || "").slice(0, 10)}.
        {" "}<a href={meta.public_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--cyan)" }}>QuantConnect 공개 결과 페이지 ↗</a> (외부 호스팅이라 접속이 안 될 때가 있습니다)
      </div>
    </div>
  );
}
