// 검증 기록 — 환율 유니버스 봇의 제3자 검증 기록 모음 (2026-10-19, 2026-10-25 디자인 시스템 + QuantConnect 자체 호스팅)
// 1) FX Blue 실시간 현황판(Publisher EA 발행) 2) Myfxbook 검증 배지(투자자 비번 직접 접속)
// 3) QuantConnect 독립 엔진·데이터 백테스트 — 공개 임베드(quantconnect.cloud)가 자주 죽어, 결과 원본을 API로 내려받아
//    src/data/qc_backtest.json 에 두고 QcBacktestView 가 직접 그린다 (reversion_research/platforms/quantconnect/qc_fetch_result.py → build_verified_data.py).
// 4) 코스피200 ETF(ALIGN3) QuantConnect 재현 — src/data/qc_backtest_kospi.json (reversion_research/platforms/quantconnect/kospi/build_kospi_verified.py).
// 5) 코스피200 선물 「눌림 갭업 숏」(2026-11-01) — src/data/kospi_pullback_gapshort.json (reversion_research/backtests/build_pullback_gapshort_site.py), KospiStrategyView.
// 탭(2026-11-01): '환율 봇'(1~3) / '코스피200'(ETF ALIGN3 + 선물 전략). ?tab=kospi 로 직접 진입. 상단 목차는 탭별로 바뀐다.
// 숫자·링크·주의문은 src/data/verified.json (publish_site.py 가 갱신). 정적 페이지.
import React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import V from "../src/data/verified.json";
import QC from "../src/data/qc_backtest.json";
import QCK from "../src/data/qc_backtest_kospi.json";
import KPG from "../src/data/kospi_pullback_gapshort.json";
import QCP from "../src/data/qc_backtest_kospi_pgs.json";
import { ldJson, ORG } from "../src/lib/jsonLd";
import SectionHead from "../src/components/ui/SectionHead";
import Panel, { Chip, LiveBadge } from "../src/components/ui/Panel";
import QcBacktestView from "../src/components/QcBacktestView";
import KospiStrategyView from "../src/components/KospiStrategyView";
import StrategyRecord from "../src/components/StrategyRecord";

const SITE = "https://hyeongeonnoil.com";
const TITLE = "검증 기록 — 자동매매 봇의 제3자 검증(FX Blue·Myfxbook·QuantConnect)과 코스피200 전략 검증 | NewsInsight";
const DESC = "환율 7종 자동매매 봇(MT5 데모)과 코스피200 봇의 검증 기록입니다. FX Blue 실시간 현황판, Myfxbook 검증 배지, QuantConnect 독립 백테스트, 그리고 코스피200 선물 전략(눌림 갭업 숏)의 10년 1분봉 검증 결과와 그 한계를 함께 적었습니다.";

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

const TABS = [
  { key: "fx", label: "환율 봇", icon: "💱" },
  { key: "kospi", label: "코스피200", icon: "🇰🇷" },
];

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

// 탭 바 — 시세 차트 분류 탭(.cat-tabs)과 같은 생김새. URL ?tab= 으로 상태를 들고 다녀 링크 공유가 된다.
function VerifiedTabs({ tab }) {
  return (
    <div className="cat-tabs" role="tablist" aria-label="검증 기록 분류">
      {TABS.map((t) => {
        const on = tab === t.key;
        return (
          <Link key={t.key} href={t.key === "fx" ? "/verified" : { pathname: "/verified", query: { tab: t.key } }} shallow scroll={false}
            role="tab" aria-selected={on} className={`cat-tab${on ? " is-on" : ""}`}>
            <span aria-hidden>{t.icon}</span> {t.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function VerifiedPage() {
  const router = useRouter();
  const tab = router.query?.tab === "kospi" ? "kospi" : "fx";
  const q = V.quantconnect;
  const k = V.kospi;
  const hasKospi = Boolean(k && QCK?.stats);
  const s10 = KPG.stats_10y;
  const kp = V.kospi_pgs;
  const hasPgsQc = Boolean(kp && QCP?.stats);
  const tocFx = [
    { id: "v-fxblue", n: 1, src: "FX Blue", title: "실시간 현황판", level: "계좌가 직접 발행", color: "var(--cyan)",
      fact: ["환율 데모 계좌", "5분마다 발행", `${V.fxblue.since}~`] },
    { id: "v-myfxbook", n: 2, src: "Myfxbook", title: "검증 배지", level: "제3자 검증", color: "var(--ok)",
      fact: [...V.myfxbook.badges, `연결 ${V.myfxbook.since}`] },
    { id: "v-qc-fx", n: 3, src: "QuantConnect", title: "환율 17셀 재현", level: "외부 엔진 · 외부 데이터", color: "var(--ok)",
      fact: [q.period, `순이익 ${pct(QC.stats.net_profit_pct)}`, `낙폭 −${QC.stats.max_dd_pct}%`] },
  ];
  const tocKospi = [
    ...(hasKospi ? [{ id: "v-qc-kospi", n: 1, src: "QuantConnect", title: "코스피200 ETF 재현 (ALIGN3)", level: "외부 엔진 · 자체 데이터", color: "var(--warn)",
      fact: [k.period, `순이익 ${pct(QCK.stats.net_profit_pct)}`, `낙폭 −${QCK.stats.max_dd_pct}%`] }] : []),
    { id: "v-kospi-pgs", n: hasKospi ? 2 : 1, src: hasPgsQc ? "QuantConnect" : "자체 엔진 · 크레온 1분봉", title: `선물 전략 1 — ${KPG.name}`, level: hasPgsQc ? "외부 엔진 · 자체 데이터" : "자체 엔진 · 자체 데이터", color: "var(--warn)",
      fact: hasPgsQc ? [kp.period, `${QCP.three_way?.qc?.n}건 · 건당 ${pct(QCP.three_way?.qc?.mean)}`, `순이익 ${pct(QCP.stats.net_profit_pct)}`, `낙폭 −${QCP.stats.max_dd_pct}%`]
                     : [KPG.period, `${s10.n}건 · 건당 ${pct(s10.exp_pct)}`, `총 ${pct(s10.total_pct)}`, `낙폭 −${s10.mdd_pct}%`] },
  ];
  const toc = tab === "kospi" ? tocKospi : tocFx;
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

      <SectionHead kicker="VERIFIED" title="검증 기록" desc="제3자 서버가 집계·검증한 기록과, 아직 그 단계 전인 자체 검증 기록을 증거 수준을 표시해 함께 둡니다"
        aside={<LiveBadge live liveText={`기준일 ${V.updated}`} />} />
      <div style={{ padding: "0 8px 12px" }}><VerifiedTabs tab={tab} /></div>

      {tab === "fx" ? (
        <p style={{ ...p, padding: "0 8px" }}>
          1~3번은 {V.account.label}에서 돌아가는 봇의 기록입니다.
          사이트의 <Link href="/reports" style={{ color: "var(--cyan)" }}>보고서</Link>와{" "}
          <Link href="/fx" style={{ color: "var(--cyan)" }}>FX 현황</Link>은 자체 장부 기준이고, 이 페이지는 그 장부를 바깥에서 대조하는 용도입니다.
          {" "}{V.account.note} 가동 {V.account.live_since}~.
        </p>
      ) : (
        <p style={{ ...p, padding: "0 8px" }}>
          코스피200 기록 두 가지입니다. {hasKospi ? "1번은 ETF 봇(ALIGN3), " : ""}{hasKospi ? "2번" : "1번"}은 지수선물 단타 전략 「{KPG.name}」.
          둘 다 같은 규칙을 QuantConnect(LEAN) 엔진으로 다시 돌린 결과로 보여주며, 데이터는 자체 수집(크레온)입니다.
        </p>
      )}

      <div style={{ display: "grid", gap: 16, padding: "0 8px" }}>
        <Toc items={toc} />

        {tab === "fx" && (
          <>
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
          </>
        )}

        {tab === "kospi" && (
          <>
            {/* 코스피 1. ALIGN3 를 QuantConnect 엔진으로 재현 (데이터는 자체 수집) */}
            {hasKospi && (
              <>
                <SectionHead id="v-qc-kospi" aside={<TopLink />} kicker="KOSPI ETF · ALIGN3" title="1. ETF 전략 — 「ALIGN3」 3층 정렬 추세롱"
                  desc="한국투자증권 실계좌에서 돌아가는 규칙. 그래프와 성과는 QuantConnect(LEAN) 엔진 재현 기준(5년 5분봉)입니다." />
                <StrategyRecord qc={QCK} meta={k} side="롱 · 멀티로트" market="코스피200 ETF (KODEX200)" />
              </>
            )}

            {/* 코스피 2. 선물 전략 1 — 눌림 갭업 숏: 전략 / 그래프(QuantConnect) / 성과 세 덩어리, 나머지는 '자세히' */}
            <SectionHead id="v-kospi-pgs" aside={<TopLink />} kicker="KOSPI FUTURES · STRATEGY 1" title={`${hasKospi ? 2 : 1}. 선물 전략 1 — 「${KPG.name}」`}
              desc={hasPgsQc ? "네 조건이 모두 맞는 날만 숏, 손절 또는 마감 청산. 그래프와 성과는 QuantConnect(LEAN) 엔진 재현 기준(5년 1분봉)입니다." : `${KPG.market}. 자체 엔진·자체 데이터 결과입니다.`} />
            {hasPgsQc ? <StrategyRecord kpg={KPG} qc={QCP} meta={kp} /> : <KospiStrategyView data={KPG} />}
          </>
        )}
      </div>

      <p className="meta" style={{ padding: "16px 8px 0", lineHeight: 1.7 }}>
        이 페이지는 투자 권유가 아닙니다. 환율 기록은 데모 계좌이고, 코스피 ETF 기록은 소액 실계좌에서 돌아가는 규칙을 재현한 백테스트, 코스피 선물 전략은 실거래 전의 자체 백테스트입니다.
        실제 성과·수수료·슬리피지는 다를 수 있습니다.
        월간·주간 자체 보고서는 <Link href="/reports" style={{ color: "var(--cyan)" }}>보고서</Link>에서 볼 수 있습니다.
      </p>
    </div>
  );
}
