// 크립토 검증 기록 뷰 — /verified 크립토 탭 (2026-11-02)
// 데이터: src/data/crypto_btc_book.json (reversion_research/backtests/build_crypto_btc_site.py)
// 종목 탭(?tab=crypto&sym=…) → BTCUSDT: 특징 → 전략 카드 4개(숏 C1·C2, 롱 L1·L2, 11/3 롱 추가) → 한 계좌 운용(누적 차트·레버리지·1천만 원 연도별) → 공통 규칙·비용 → 버린 것 → 주의 → 거래 목록(접기)
//                            그 밖 종목: 검증 예정 안내
// 11/3: 지수 탭 나스닥100 책(src/data/index_ndx_book.json)도 같은 뷰로 그림 — 종목별 문구(badge·ret_label·id_prefix·chart·book_title·book_note·krw_label·krw_note)는
//       데이터에 있으면 그걸 쓰고, 없으면 크립토 기본 문구. 종목 확인은 data.symbol 과 sym 비교(지수 탭은 sym 없이 호출).
import React, { useState } from "react";
import Link from "next/link";
import Panel, { Chip } from "./ui/Panel";

const p = { lineHeight: 1.8, fontSize: "var(--fs-md)", margin: "0 0 10px", color: "var(--text-2)" };
const fmtPct = (v, d = 1) => (v == null ? "—" : `${v > 0 ? "+" : ""}${Number(v).toFixed(d)}%`);
const won = (v) => `${Number(v).toLocaleString("ko-KR")}만`;
const th = { textAlign: "right", padding: "6px 8px", fontSize: "var(--fs-xs)", color: "var(--muted)", fontWeight: 700, whiteSpace: "nowrap", borderBottom: "1px solid var(--line)" };
const td = { textAlign: "right", padding: "6px 8px", fontSize: "var(--fs-sm)", color: "var(--text)", whiteSpace: "nowrap", borderBottom: "1px solid var(--line)" };
const tone = (v) => (v > 0 ? "var(--up)" : v < 0 ? "var(--down)" : "var(--text)");
const li = { lineHeight: 1.7, fontSize: "var(--fs-sm)", color: "var(--text-2)" };

export const CRYPTO_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "XAUTUSDT"];

export function CryptoSymbolTabs({ sym, ready = ["BTCUSDT"] }) {
  return (
    <div className="cat-tabs" role="tablist" aria-label="크립토 종목">
      {CRYPTO_SYMBOLS.map((s) => {
        const on = sym === s;
        return (
          <Link key={s} href={{ pathname: "/verified", query: s === "BTCUSDT" ? { tab: "crypto" } : { tab: "crypto", sym: s } }} shallow scroll={false}
            role="tab" aria-selected={on} className={`cat-tab${on ? " is-on" : ""}`}>
            {s.replace("USDT", "")}{!ready.includes(s) && <span style={{ opacity: 0.6, fontWeight: 600 }}> · 예정</span>}
          </Link>
        );
      })}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="inset" style={{ padding: "8px 10px", minWidth: 110 }}>
      <div className="meta">{label}</div>
      <div style={{ fontWeight: 800, fontSize: "var(--fs-lg)", color: color || "var(--text)" }}>{value}</div>
    </div>
  );
}

function StrategyCard({ s, cfg }) {
  return (
    <Panel id={`${cfg.prefix}-${s.id.toLowerCase()}`} icon={s.side === "롱" ? "📈" : "📉"} title={`${s.id} ${s.name}`} meta={`${s.side} · ${s.hold} · ${s.zone}`} hover={false}
      badge={<Chip color="var(--warn)">{cfg.badge}</Chip>}>
      <p style={p}>{s.why}</p>
      <div className="inset" style={{ padding: "10px 12px", marginBottom: 12, lineHeight: 1.8, fontSize: "var(--fs-sm)" }}>
        <div><b>진입</b> {s.entry}</div>
        <div><b>청산</b> {s.exit}</div>
        <div className="meta" style={{ marginTop: 4 }}>{s.vol_note}</div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <Stat label={`거래 (${s.period})`} value={`${s.n}건 · 연 ${s.per_year}`} />
        <Stat label={cfg.retLabel} value={fmtPct(s.exp_pct, 2)} color={tone(s.exp_pct)} />
        <Stat label="큰 5건 뺀 건당" value={fmtPct(s.x5_pct, 2)} color={tone(s.x5_pct)} />
        <Stat label="승률" value={`${s.win_rate}%`} />
        <Stat label="총이익 ÷ 총손실" value={`${s.pf}배`} />
        <Stat label="1배 복리 누적" value={fmtPct(s.total_pct, 0)} color={tone(s.total_pct)} />
        <Stat label="최대 낙폭" value={`−${s.mdd_pct}%`} />
        <Stat label="1건 최대 손실" value={`${s.worst_pct}%`} />
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={{ ...th, textAlign: "left" }}>연도</th>{s.yearly.map((y) => <th key={y.year} style={th}>{y.year}</th>)}</tr></thead>
          <tbody>
            <tr><td style={{ ...td, textAlign: "left" }} className="meta">건수</td>{s.yearly.map((y) => <td key={y.year} style={td}>{y.n}</td>)}</tr>
            <tr><td style={{ ...td, textAlign: "left" }} className="meta">건당</td>{s.yearly.map((y) => <td key={y.year} style={{ ...td, color: tone(y.exp_pct) }}>{fmtPct(y.exp_pct, 2)}</td>)}</tr>
            <tr><td style={{ ...td, textAlign: "left" }} className="meta">그해 수익(1배)</td>{s.yearly.map((y) => <td key={y.year} style={{ ...td, color: tone(y.ret_pct) }}>{fmtPct(y.ret_pct)}</td>)}</tr>
          </tbody>
        </table>
      </div>
      <p className="meta" style={{ margin: "8px 0 0" }}>{s.stop_n ? `손절 ${s.stop_n}건 · 나머지는 시간 청산` : "손절 없음 · 전부 시간 청산"} · 1건 최대 이익 {fmtPct(s.best_pct, 1)}</p>
    </Panel>
  );
}

function Trades({ S }) {
  const [open, setOpen] = useState(null);
  const cur = S.find((s) => s.id === open);
  return (
    <Panel icon="🧾" title="거래 목록" meta="전략을 누르면 펼침 · 시각은 각 전략의 기준 시간대" hover={false}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: open ? 10 : 0 }}>
        {S.map((s) => (
          <button key={s.id} type="button" className="chip" onClick={() => setOpen(open === s.id ? null : s.id)} style={{ cursor: "pointer", font: "inherit", fontSize: "var(--fs-xs)", fontWeight: 700 }}>
            {open === s.id ? "접기 · " : ""}{s.id} {s.name} ({s.n})
          </button>
        ))}
      </div>
      {cur && (
        <div style={{ overflowX: "auto", maxHeight: 420 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ ...th, textAlign: "left" }}>날짜</th><th style={th}>진입</th><th style={th}>청산</th><th style={th}>진입가</th><th style={th}>청산가</th><th style={th}>사유</th><th style={th}>변동폭</th><th style={th}>수익(후)</th></tr></thead>
            <tbody>
              {[...cur.trades].reverse().map((t) => (
                <tr key={t.t}>
                  <td style={{ ...td, textAlign: "left" }}>{t.date}</td><td style={td}>{t.entry_time}</td><td style={td}>{t.exit_time}</td>
                  <td style={td}>{t.entry.toLocaleString()}</td><td style={td}>{t.exit.toLocaleString()}</td><td style={td}>{t.reason}</td><td style={td}>{t.vol_pct}%</td>
                  <td style={{ ...td, color: tone(t.ret_pct), fontWeight: 700 }}>{fmtPct(t.ret_pct, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

export default function CryptoBookView({ data, sym = data.symbol }) {
  if (sym !== data.symbol) {
    const o = (data.other_symbols || []).find((x) => x.symbol === sym);
    return (
      <Panel icon="⏳" title={`${sym} — 검증 예정`} meta={data.venue} hover={false}>
        <p style={{ ...p, margin: 0 }}>{o?.note || "검증 예정"}. BTCUSDT에서 찾은 시간대 특징이 이 종목에도 있는지부터 확인한 뒤, 따로 규칙을 정해 여기에 기록합니다.</p>
      </Panel>
    );
  }
  const S = data.strategies || []; const b = data.book || {};
  const cfg = {
    prefix: data.id_prefix || "v-crypto",
    badge: data.badge || "자체 엔진 · 바이비트 1분봉",
    retLabel: data.ret_label || "건당 (수수료·펀딩 후)",
    chart: data.chart || "/verified/crypto-btc-book.png",
    bookTitle: data.book_title || `${(b.parts || []).length}개 전략 한 계좌`,
    bookNote: data.book_note || "숏 둘(장중)과 롱 둘(장 밖)을 한 계좌에서 돌린 결과입니다. 전략마다 평가액 100%를 쓰고, 청산한 날의 손익을 날마다 합쳐 복리로 쌓았습니다. 보유가 겹치는 순간에는 총 노출이 2~3배가 되고, 롱과 숏이 겹치면 서로 상쇄됩니다. 레버리지를 올리면 수익과 낙폭이 거의 같은 비율로 커지므로 감당할 낙폭으로 배수를 정합니다. '운 나쁜 낙폭'은 하루 손익 순서를 2,000번 섞었을 때 상위 5%에 해당하는 낙폭입니다.",
    krwLabel: data.krw_label || "2021년 초 1,000만 원으로 시작, 수익 재투자(단위 만 원)",
    krwNote: data.krw_note || "표의 거래 수는 그해 네 전략 합계입니다. 환전·세금·슬리피지는 넣지 않았습니다.",
  };
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Panel icon="🧭" title={`${data.label || data.symbol} 시간대 특징`} meta={data.data_note} hover={false} badge={<Chip color="var(--warn)">{data.status}</Chip>}>
        <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
          {(data.facts || []).map((f, i) => <li key={i} style={li}>{f}</li>)}
        </ul>
      </Panel>

      {S.map((s) => <StrategyCard key={s.id} s={s} cfg={cfg} />)}

      <Panel id={`${cfg.prefix}-book`} icon="🧮" title={cfg.bookTitle} meta={`${b.window} · ${b.n}건 · 연 ${b.per_year}건`} hover={false}>
        <img src={`${cfg.chart}?v=${data.updated}-${b.n}`} alt={`${data.label || data.symbol} 책 누적 수익`} style={{ width: "100%", display: "block", borderRadius: 8, marginBottom: 12 }} loading="lazy" />
        <p style={p}>{cfg.bookNote}</p>
        <div style={{ overflowX: "auto", marginBottom: 14 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ ...th, textAlign: "left" }}>레버리지</th><th style={th}>연 수익(복리)</th><th style={th}>과거 최대 낙폭</th><th style={th}>운 나쁜 낙폭</th><th style={th}>하루 최악</th></tr></thead>
            <tbody>
              {(b.leverage || []).map((r) => (
                <tr key={r.lev}><td style={{ ...td, textAlign: "left", fontWeight: 700 }}>{r.lev}배</td><td style={{ ...td, color: tone(r.cagr_pct) }}>{fmtPct(r.cagr_pct)}</td>
                  <td style={td}>−{r.mdd_pct}%</td><td style={td}>−{r.bad_mdd_pct}%</td><td style={td}>{r.worst_day_pct}%</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="meta" style={{ marginBottom: 6, fontWeight: 700 }}>{cfg.krwLabel}</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr><th style={{ ...th, textAlign: "left" }}>연도</th><th style={th}>거래</th>
                {(b.krw || []).map((k) => <React.Fragment key={k.lev}><th style={th}>{k.lev}배 연말</th><th style={th}>{k.lev}배 수익률</th><th style={th}>{k.lev}배 연중 낙폭</th></React.Fragment>)}
              </tr>
            </thead>
            <tbody>
              {(b.krw?.[0]?.rows || []).map((r, i) => (
                <tr key={r.year}>
                  <td style={{ ...td, textAlign: "left" }}>{r.year}{r.partial ? " (10월까지)" : ""}</td><td style={td}>{r.n}건</td>
                  {b.krw.map((k) => { const x = k.rows[i]; return (
                    <React.Fragment key={k.lev}><td style={td}>{won(x.end)}</td><td style={{ ...td, color: tone(x.ret_pct), fontWeight: 700 }}>{fmtPct(x.ret_pct)}</td><td style={td}>−{x.mdd_pct}%</td></React.Fragment>
                  ); })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="meta" style={{ margin: "8px 0 0", lineHeight: 1.6 }}>1배 연도별: {(b.yearly_1x || []).map((y) => `${y.year} ${fmtPct(y.ret_pct, 0)}`).join(" · ")}. {cfg.krwNote}</p>
      </Panel>

      <Panel icon="📐" title="공통 규칙 · 비용" hover={false}>
        <p style={p}>{data.rules_common}</p>
        <p style={{ ...p, margin: 0 }}>{data.costs}</p>
      </Panel>

      <Panel icon="🗑️" title="검토했다가 버린 것" meta={`${(data.rejected || []).length}가지`} hover={false}>
        <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
          {(data.rejected || []).map((c, i) => <li key={i} style={li}>{c}</li>)}
        </ul>
      </Panel>

      <Panel icon="⚠️" title="주의" meta={`${(data.caveats || []).length}가지`} hover={false}>
        <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
          {(data.caveats || []).map((c, i) => <li key={i} style={li}>{c}</li>)}
        </ul>
      </Panel>

      <Trades S={S} />
    </div>
  );
}
