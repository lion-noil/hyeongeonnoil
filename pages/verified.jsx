// 검증 기록 — 환율 유니버스 봇의 제3자 검증 기록 모음 (2026-10-19, 2026-10-25 디자인 시스템 + QuantConnect 자체 호스팅)
// 1) FX Blue 실시간 현황판(Publisher EA 발행) 2) Myfxbook 검증 배지(투자자 비번 직접 접속)
// 3) QuantConnect 독립 엔진·데이터 백테스트 — 공개 임베드(quantconnect.cloud)가 자주 죽어, 결과 원본을 API로 내려받아
//    src/data/qc_backtest.json 에 두고 QcBacktestView 가 직접 그린다 (reversion_research/platforms/quantconnect/qc_fetch_result.py → build_verified_data.py).
// 4) 코스피200 ETF(ALIGN3) QuantConnect 재현 — src/data/qc_backtest_kospi.json (reversion_research/platforms/quantconnect/kospi/build_kospi_verified.py).
// 상단 목차(2026-10-27): 섹션별 증거 수준 + 핵심 숫자 카드, 앵커는 v-fxblue / v-myfxbook / v-qc-fx / v-qc-kospi.
// 숫자·링크·주의문은 src/data/verified.json (publish_site.py 가 갱신). 정적 페이지.
import React from "react";
import Head from "next/head";
import Link from "next/link";
import V from "../src/data/verified.json";
import QC from "../src/data/qc_backtest.json";
import QCK from "../src/data/qc_backtest_kospi.json";
import { ldJson, ORG } from "../src/lib/jsonLd";
import SectionHead from "../src/components/ui/SectionHead";
import Panel, { Chip, LiveBadge } from "../src/components/ui/Panel";
import QcBacktestView from "../src/components/QcBacktestView";

const SITE = "https://hyeongeonnoil.com";
const TITLE = "검증 기록 — 자동매매 봇의 제3자 검증(FX Blue·Myfxbook·QuantConnect) | NewsInsight";
const DESC = "환율 7종 자동매매 봇(MT5 데모)과 코스피200 ETF 봇(한국투자증권)의 외부 검증 기록입니다. FX Blue 실시간 현황판, Myfxbook 검증 배지, QuantConnect 독립 백테스트의 자본곡선·월별·셀별 결과와 그 한계를 함께 적었습니다.";

const PAGE_LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebPage", name: "검증 기록 — 자동매매 봇의 제3자 검증", url: `${SITE}/verified`, description: DESC, inLanguage: "ko",
      isPartOf: { "@type": "WebSite", name: "현건노일 NewsInsight", url: SITE }, publisher: ORG, dateModified: V.updated },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "검증 기록", item: `${SITE}/verified` } ] },
  ],
};

const wrap = { maxWidth: 1100, margin: "0 auto", padding: "8px 16px 40px" };
const frame = { width: "100%", border: 0, borderRadius: 10, background: "var(--panel-solid)", display: "block" };
const p = { lineHeight: 1.8, fontSize: "var(--fs-md)", margin: "0 0 10px", color: "var(--text-2)" };

function Ext({ href, children }) {
  return <Chip href={href} color="var(--cyan)">{children} ↗</Chip>;
}

const pct = (v) => (v == null ? "—" : `${v > 0 ? "+" : ""}${Number(v).toFixed(1)}%`);

// 상단 목차 카드: 번호·출처 / 제목 / 증거 수준 칩 / 핵심 한 줄
function Toc({ items }) {
  return (
    <Panel icon="🧭" title="목차" meta={`기록 ${items.length}개 · 카드를 누르면 해당 섹션으로 이동`} hover={false} pad={12} id="v-toc">
      <nav aria-label="검증 기록 목차" className="toc-grid">
        {items.map((t) => (
          <a key={t.id} href={`#${t.id}`} className="inset toc-card">
            <div className="meta" style={{ marginBottom: 4 }}>{t.n}. {t.src}</div>
            <div style={{ fontSize: "var(--fs-md)", fontWeight: 800, color: "var(--text)", marginBottom: 8, letterSpacing: "-0.01em" }}>{t.title}</div>
            <Chip color={t.color}>{t.level}</Chip>
            <div className="meta" style={{ marginTop: 8, lineHeight: 1.6 }}>
              {/* 구분자 공백은 nowrap 밖 — 항목 사이에서만 줄바꿈되고 날짜·숫자는 안 끊긴다 */}
              {t.fact.map((f, i) => (
                <React.Fragment key={f}>{i > 0 && " · "}<span style={{ whiteSpace: "nowrap" }}>{f}</span></React.Fragment>
              ))}
            </div>
          </a>
        ))}
      </nav>
    </Panel>
  );
}

const TopLink = () => <a href="#v-toc" className="toc-top">목차 ↑</a>;

export default function VerifiedPage() {
  const q = V.quantconnect;
  const k = V.kospi;
  const hasKospi = Boolean(k && QCK?.stats);
  const toc = [
    { id: "v-fxblue", n: 1, src: "FX Blue", title: "실시간 현황판", level: "계좌가 직접 발행", color: "var(--cyan)",
      fact: ["환율 데모 계좌", "5분마다 발행", `${V.fxblue.since}~`] },
    { id: "v-myfxbook", n: 2, src: "Myfxbook", title: "검증 배지", level: "제3자 검증", color: "var(--ok)",
      fact: [...V.myfxbook.badges, `연결 ${V.myfxbook.since}`] },
    { id: "v-qc-fx", n: 3, src: "QuantConnect", title: "환율 17셀 재현", level: "외부 엔진 · 외부 데이터", color: "var(--ok)",
      fact: [q.period, `순이익 ${pct(QC.stats.net_profit_pct)}`, `낙폭 −${QC.stats.max_dd_pct}%`] },
    ...(hasKospi ? [{ id: "v-qc-kospi", n: 4, src: "QuantConnect", title: "코스피200 ETF 재현", level: "외부 엔진 · 자체 데이터", color: "var(--warn)",
      fact: [k.period, `순이익 ${pct(QCK.stats.net_profit_pct)}`, `낙폭 −${QCK.stats.max_dd_pct}%`] }] : []),
  ];
  return (
    <div style={wrap}>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESC} key="desc" />
        <link rel="canonical" href={`${SITE}/verified`} key="canonical" />
        <meta property="og:title" content={TITLE} key="og-title" />
        <meta property="og:description" content={DESC} key="og-desc" />
        <meta property="og:url" content={`${SITE}/verified`} key="og-url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(PAGE_LD) }} />
      </Head>

      <SectionHead kicker="VERIFIED" title="검증 기록" desc="제가 아닌 제3자 서버가 집계·검증한 기록만 모았습니다"
        aside={<LiveBadge live liveText={`기준일 ${V.updated}`} />} />
      <p style={{ ...p, padding: "0 8px" }}>
        1~3번은 {V.account.label}에서 돌아가는 봇{hasKospi ? ", 4번은 한국투자증권 실계좌에서 돌아가는 코스피200 ETF 봇" : ""}의 기록입니다.
        사이트의 <Link href="/reports" style={{ color: "var(--cyan)" }}>보고서</Link>와{" "}
        <Link href="/fx" style={{ color: "var(--cyan)" }}>FX 현황</Link>은 자체 장부 기준이고, 이 페이지는 그 장부를 바깥에서 대조하는 용도입니다.
        {" "}{V.account.note} 가동 {V.account.live_since}~.
      </p>

      <div style={{ display: "grid", gap: 16, padding: "0 8px" }}>
        <Toc items={toc} />

        {/* 1. FX Blue */}
        <Panel id="v-fxblue" icon="📡" title="1. 실시간 현황판 — FX Blue" meta={`공개 사용자명 ${V.fxblue.user} · 발행 시작 ${V.fxblue.since}`}
          footer={<><Ext href={V.fxblue.stats_url}>FX Blue 통계 페이지</Ext><Ext href={V.fxblue.page_url}>거래 내역</Ext></>}>
          <p style={p}>{V.fxblue.how}</p>
          <iframe src={V.fxblue.chart_embed} title="FX Blue 누적 손익 차트" loading="lazy" style={{ ...frame, height: 240 }} />
        </Panel>

        {/* 2. Myfxbook */}
        <Panel id="v-myfxbook" icon="🛡️" title="2. 검증 배지 — Myfxbook" meta={`연결 ${V.myfxbook.since}`}
          badge={<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{V.myfxbook.badges.map((b) => <Chip key={b} color="var(--ok)">✓ {b}</Chip>)}</div>}
          footer={<Ext href={V.myfxbook.url}>Myfxbook 계좌 페이지</Ext>}>
          <p style={{ ...p, margin: 0 }}>{V.myfxbook.how} 거래 이력은 연결 뒤 동기화된 분부터 쌓입니다.</p>
        </Panel>

        {/* 3. QuantConnect — 자체 호스팅 */}
        <SectionHead id="v-qc-fx" aside={<TopLink />} kicker="INDEPENDENT BACKTEST" title="3. 독립 엔진·데이터 재현 — QuantConnect"
          desc="같은 규칙(환율 셀 17개, 라이브와 동일한 사이징)을 LEAN 엔진용으로 다시 구현해 다른 데이터·다른 엔진·다른 체결 모델로 돌린 결과" />
        <p style={p}>
          {q.cell_match}. 기간 {q.period}, 실행 {q.run_at}, {q.engine}. 결과 원본(자본곡선·월별 통계·청산 거래 {QC.stats.closed_trades}건)은
          QuantConnect API에서 내려받아 이 사이트가 직접 그립니다 — 외부 공개 페이지가 접속되지 않아도 아래는 그대로 봅니다.
          {q.code_note ? ` ${q.code_note}` : ""}
        </p>
        <QcBacktestView data={QC} caveats={q.caveats} expectation={q.expectation} />

        {/* 4. 코스피 — ALIGN3 를 QuantConnect 엔진으로 재현 (데이터는 자체 수집) */}
        {hasKospi && (
          <>
            <SectionHead id="v-qc-kospi" aside={<TopLink />} kicker="KOSPI · INDEPENDENT ENGINE" title="4. 코스피200 ETF 재현 — QuantConnect (데이터는 자체 수집)"
              desc="한국투자증권 실계좌에서 돌아가는 ALIGN3(3층 정렬 추세롱) 규칙을 LEAN 엔진용으로 다시 구현해 돌린 결과. 엔진·체결 모델은 외부지만 5분봉 데이터는 자체 수집이라, 환율(외부 데이터)보다 한 단계 약한 검증입니다" />
            <p style={p}>
              {k.account_note} {k.how} {k.cell_match} 기간 {k.period}, 실행 {k.run_at}, {k.engine}. 결과 원본(자본곡선·월별 통계·청산 거래 {QCK.stats.closed_trades}건)은
              QuantConnect API에서 내려받아 이 사이트가 직접 그립니다.
            </p>
            <QcBacktestView data={QCK} caveats={k.caveats} expectation={k.expectation} currency="KRW" feeNote={k.fee_note} />
          </>
        )}
      </div>

      <p className="meta" style={{ padding: "16px 8px 0", lineHeight: 1.7 }}>
        이 페이지는 투자 권유가 아닙니다. 환율 기록은 데모 계좌이고, 코스피 기록은 소액 실계좌에서 돌아가는 규칙을 재현한 백테스트입니다.
        실제 성과·수수료·슬리피지는 다를 수 있습니다.
        월간·주간 자체 보고서는 <Link href="/reports" style={{ color: "var(--cyan)" }}>보고서</Link>에서 볼 수 있습니다.
      </p>
    </div>
  );
}
