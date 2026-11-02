// 코스피200 선물 전략 검증 기록 뷰 — /verified 코스피200 탭. (2026-11-01)
// 데이터: src/data/kospi_pullback_gapshort.json (reversion_research/backtests/build_pullback_gapshort_site.py 가 만든다)
// 자체 엔진·자체 데이터(크레온 1분봉) 결과라 QuantConnect 재현보다 한 단계 약한 검증 — 그 점을 본문·주의문에 그대로 적는다.
// 구성: 규칙 4조건 + 청산 → 핵심 숫자 타일(10년) → 10년/최근 5년/2026 제외 비교표 → 연도별 → 퍼널 → 차트(PNG) → 기각한 변형 → 주의문 → 거래 목록(접기)
import React, { useState } from "react";
import Panel, { Chip } from "./ui/Panel";

const p = { lineHeight: 1.8, fontSize: "var(--fs-md)", margin: "0 0 10px", color: "var(--text-2)" };
const fmtPct = (v, d = 1) => (v == null ? "—" : `${v > 0 ? "+" : ""}${Number(v).toFixed(d)}%`);
const th = { textAlign: "right", padding: "6px 8px", fontSize: "var(--fs-xs)", color: "var(--muted)", fontWeight: 700, whiteSpace: "nowrap", borderBottom: "1px solid var(--line)" };
const td = { textAlign: "right", padding: "6px 8px", fontSize: "var(--fs-sm)", color: "var(--text)", whiteSpace: "nowrap", borderBottom: "1px solid var(--line)" };
const tone = (v) => (v > 0 ? "var(--up)" : v < 0 ? "var(--down)" : "var(--text)");

function StatTile({ label, value, sub, color }) {
  return (
    <div className="inset" style={{ padding: "12px 14px", minWidth: 0 }}>
      <div className="meta" style={{ marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: color || "var(--text)", lineHeight: 1.1 }}>{value}</div>
      {sub && <div className="meta" style={{ marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function StatsRow({ label, s }) {
  return (
    <tr>
      <td style={{ ...td, textAlign: "left", fontWeight: 700 }}>{label}</td>
      <td style={td}>{s.n}건 (연 {s.per_year})</td>
      <td style={{ ...td, color: tone(s.exp_pct) }}>{fmtPct(s.exp_pct, 3)}</td>
      <td style={td}>{s.win_rate}%</td>
      <td style={td}>{s.pf}배</td>
      <td style={{ ...td, color: tone(s.total_pct) }}>{fmtPct(s.total_pct)}</td>
      <td style={td}>−{s.mdd_pct}%</td>
      <td style={td}>{s.neg_years}/{s.years}</td>
    </tr>
  );
}

export default function KospiStrategyView({ data }) {
  const [openTrades, setOpenTrades] = useState(false);
  const [openRejected, setOpenRejected] = useState(false);
  const s = data.stats_10y; const f = data.funnel;
  const y26 = s.yearly.find((y) => y.year === 2026);
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* 규칙 */}
      <Panel icon="📐" title="규칙 — 네 조건의 교집합" meta="장 시작 전 ①, 첫 체결 때 ②, 장중 ③④" hover={false}>
        <p style={p}>{data.logic}</p>
        <ol style={{ margin: "0 0 10px", paddingLeft: 22, display: "grid", gap: 6 }}>
          {data.rules.map((r) => (
            <li key={r.no} style={{ lineHeight: 1.7, fontSize: "var(--fs-md)", color: "var(--text-2)" }}>
              <b style={{ color: "var(--text)" }}>{r.name}</b> — {r.text}
            </li>
          ))}
        </ol>
        <p style={{ ...p, margin: 0 }}><b style={{ color: "var(--text)" }}>청산</b> — {data.exit}</p>
      </Panel>

      {/* 핵심 숫자 */}
      <Panel icon="📊" title="결과 — 실선물 1분봉 10년" meta={`${data.period} · ${data.fee_note}`} hover={false}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 14 }}>
          <StatTile label="거래 수" value={`${s.n}건`} sub={`연 ${s.per_year}건 · 손절 ${s.stops}건`} />
          <StatTile label="건당 수익 (수수료 후)" value={fmtPct(s.exp_pct, 2)} sub={`이익 평균 ${fmtPct(s.avg_win_pct, 2)} / 손실 평균 ${fmtPct(s.avg_loss_pct, 2)}`} color={tone(s.exp_pct)} />
          <StatTile label="승률" value={`${s.win_rate}%`} />
          <StatTile label="총이익 ÷ 총손실" value={`${s.pf}배`} />
          <StatTile label="총수익 (단순 합)" value={fmtPct(s.total_pct)} sub="1계약 고정, 복리 없음" color={tone(s.total_pct)} />
          <StatTile label="최대 낙폭" value={`−${s.mdd_pct}%`} sub={`손실 연도 ${s.neg_years}/${s.years}`} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={{ ...th, textAlign: "left" }}>구간</th><th style={th}>거래</th><th style={th}>건당</th><th style={th}>승률</th><th style={th}>총이익÷총손실</th><th style={th}>총수익</th><th style={th}>최대낙폭</th><th style={th}>손실연도</th>
            </tr></thead>
            <tbody>
              <StatsRow label="10년 전체 (2016-08~2026-10)" s={data.stats_10y} />
              <StatsRow label="최근 5년 (2021-11~2026-10)" s={data.stats_5y} />
              <StatsRow label="2026년 제외 (2016-08~2025-12)" s={data.stats_ex2026} />
            </tbody>
          </table>
        </div>
        <p className="meta" style={{ marginTop: 8, lineHeight: 1.6 }}>
          10년 총수익 {fmtPct(s.total_pct)} 중 2026년이 {y26 ? fmtPct(y26.ret_pct) : "—"}입니다. 2026년을 빼면 총이익÷총손실 {data.stats_ex2026.pf}배{data.stats_ex2026.pf > s.pf + 0.3 ? "로 오히려 높습니다" : data.stats_ex2026.pf >= 1.7 ? "로 비슷합니다" : "로 평범합니다"} — 아래 주의문 참고.
        </p>
      </Panel>

      {/* 차트 + 연도별 */}
      <Panel icon="📈" title="누적 수익과 연도별" meta="단순 합, 수수료 후 · 상승 빨강 / 하락 파랑" hover={false} pad={0}>
        <img src="/verified/kospi-pullback-gapshort.png" alt="눌림 갭업 숏 누적 수익 곡선과 연도별 수익 막대" loading="lazy"
          style={{ width: "100%", display: "block", borderRadius: "0 0 var(--radius, 14px) var(--radius, 14px)" }} />
        <div style={{ padding: "10px 14px 14px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {s.yearly.map((y) => (
            <Chip key={y.year} color={tone(y.ret_pct)}>{y.year} {fmtPct(y.ret_pct)} · {y.n}건</Chip>
          ))}
        </div>
      </Panel>

      {/* 퍼널 */}
      <Panel icon="🔻" title="조건 퍼널 — 연평균 발생일" meta="2017~2025 평균, 거래일 연 245일" hover={false}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginBottom: 10 }}>
          {(data.funnel_labels ? data.funnel_labels.map(([k, key]) => [k, f[key]]) : [["거래일", f.days], ["① 눌림", f.c1], ["② 갭업", f.c2], ["①∧②", f.c12], ["①∧②∧③ 터치", f.c123], ["①∧②∧③∧④ 진입", f.c1234]]).map(([k, v]) => (
            <div key={k} className="inset" style={{ padding: "10px 12px" }}>
              <div className="meta">{k}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>{v}일</div>
            </div>
          ))}
        </div>
        <p className="meta" style={{ margin: 0, lineHeight: 1.6 }}>{data.funnel_note}</p>
      </Panel>

      {/* 기각한 변형 */}
      <Panel icon="🧪" title="같이 검토하고 넣지 않은 것" meta={`${data.tested_and_rejected.length}가지`} hover={false}
        actions={<button type="button" className="chip" onClick={() => setOpenRejected((v) => !v)}>{openRejected ? "접기" : "펼치기"}</button>}>
        {openRejected ? (
          <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
            {data.tested_and_rejected.map((t) => <li key={t} style={{ lineHeight: 1.7, fontSize: "var(--fs-sm)", color: "var(--text-2)" }}>{t}</li>)}
          </ul>
        ) : (
          <p className="meta" style={{ margin: 0, lineHeight: 1.6 }}>익절·시간 청산·적응형 트리거·변동성 게이트·타 자산 이식(나스닥·S&P·비트코인)을 전부 돌려 보고 뺀 이유를 적어 두었습니다.</p>
        )}
      </Panel>

      {/* 주의 */}
      <Panel icon="⚠️" title="이 기록의 한계" meta="자체 엔진 · 자체 데이터 · 실거래 전" hover={false}>
        <ul style={{ margin: "0 0 10px", paddingLeft: 20, display: "grid", gap: 6 }}>
          {data.caveats.map((c) => <li key={c} style={{ lineHeight: 1.7, fontSize: "var(--fs-sm)", color: "var(--text-2)" }}>{c}</li>)}
        </ul>
        <p style={{ ...p, margin: 0, color: "var(--text)" }}>{data.expectation}</p>
      </Panel>

      {/* 거래 목록 */}
      <Panel icon="🧾" title="거래 목록" meta={`${data.trades.length}건 · 날짜 / 진입 / 청산 / 사유 / 수익`} hover={false}
        actions={<button type="button" className="chip" onClick={() => setOpenTrades((v) => !v)}>{openTrades ? "접기" : "펼치기"}</button>}>
        {openTrades ? (
          <div style={{ overflowX: "auto", maxHeight: 520, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={{ ...th, textAlign: "left" }}>날짜</th><th style={th}>시가</th><th style={th}>진입 시각</th><th style={th}>진입가</th><th style={th}>손절선</th><th style={th}>청산 시각</th><th style={th}>청산가</th><th style={th}>사유</th><th style={th}>수익</th>
              </tr></thead>
              <tbody>
                {data.trades.map((t) => (
                  <tr key={t.date}>
                    <td style={{ ...td, textAlign: "left" }}>{t.date}</td><td style={td}>{t.open}</td><td style={td}>{t.entry_time}</td><td style={td}>{t.entry}</td><td style={td}>{t.stop ? t.stop : "—"}</td>
                    <td style={td}>{t.exit_time}</td><td style={td}>{t.exit}</td><td style={td}>{t.why}</td><td style={{ ...td, color: tone(t.ret_pct), fontWeight: 700 }}>{fmtPct(t.ret_pct, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="meta" style={{ margin: 0 }}>펼치면 {data.trades.length}건 전체(진입·손절선·청산·수익)를 볼 수 있습니다. {data.side === "롱" ? "수익은 롱 기준이라 가격이 오르면 양수입니다." : "수익은 숏 기준이라 가격이 내리면 양수입니다."}</p>
        )}
      </Panel>
    </div>
  );
}
