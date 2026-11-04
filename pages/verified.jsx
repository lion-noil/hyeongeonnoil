// 검증 기록 — 환율 유니버스 봇의 제3자 검증 기록 모음 (2026-10-19, 2026-10-25 디자인 시스템 + QuantConnect 자체 호스팅)
// 1) FX Blue 실시간 현황판(Publisher EA 발행) 2) Myfxbook 검증 배지(투자자 비번 직접 접속)
// 3) QuantConnect 독립 엔진·데이터 백테스트 — 공개 임베드(quantconnect.cloud)가 자주 죽어, 결과 원본을 API로 내려받아
//    src/data/qc_backtest.json 에 두고 QcBacktestView 가 직접 그린다 (reversion_research/platforms/quantconnect/qc_fetch_result.py → build_verified_data.py).
// 5) 코스피200 선물 「눌림 갭업 숏」(2026-11-01) — src/data/kospi_pullback_gapshort.json (reversion_research/backtests/build_pullback_gapshort_site.py), KospiStrategyView.
// 탭(2026-11-01): '환율 봇'(1~3) / '코스피200'(선물 전용 책 1~4 + ETF 전용 책 5). ALIGN3 카드는 11/2 삭제(연구 기록에만 보존). ?tab=kospi 로 직접 진입. 상단 목차는 탭별로 바뀐다.
// 크립토 탭(2026-11-02): ?tab=crypto[&sym=ETHUSDT…] — 종목 탭, BTCUSDT 책(숏 C1·C2 + 11/3 롱 L1·L2) = src/data/crypto_btc_book.json (reversion_research/backtests/build_crypto_btc_site.py), CryptoBookView.
// 지수 탭(2026-11-03): 코스피200 탭을 '지수' 아래로 옮기고 나스닥100 추가 — ?tab=index[&idx=ndx]. 예전 ?tab=kospi 링크는 지수 › 코스피200으로 연결.
//   나스닥100 책(N1~N6) = src/data/index_ndx_book.json (reversion_research/backtests/build_ndx_site.py), CryptoBookView 재사용(종목별 문구는 데이터에서).
// 원자재 탭(2026-11-04): ?tab=commodity[&cm=gold] — 금(XAUUSD) 책 G1 = src/data/commodity_gold_book.json (reversion_research/backtests/build_gold_site.py), CommodityBookView.
//   금은 '개발 2015-02~2022-12 / 독립 검증 2023-01~2026-10(규칙 확정 뒤 한 번만 개방, 사전 기준 P1~P4)' 분리가 핵심이라 결과 카드가 두 구간을 나눠 보여 준다.
// 환율 탭 교체(2026-11-04, 사용자 지시로 내림): 기존 기본 탭 '환율 봇'(카드 1~3 — FX Blue 현황판·Myfxbook 배지·QuantConnect fx-majors 재현)은 페이지에서 내렸다.
//   컴포넌트(QcBacktestView)·데이터(src/data/qc_backtest.json, verified.json 의 fxblue/myfxbook/quantconnect, verify:fx-majors 보고서)는 연구 기록으로 보존, 여기서 import 만 뺐다.
//   같은 자리(key "fx", 기본 탭, 라벨 '환율')에 연준 결정 뒤 달러 바스켓 FX1 = src/data/fx_fed_basket.json (reversion_research/backtests/build_fx_site.py), FxBookView 하나만 보여 준다.
// 숫자·링크·주의문은 src/data/verified.json (publish_site.py 가 갱신). 정적 페이지.
import React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import V from "../src/data/verified.json";
// 2026-11-04 사용자 지시로 내림: import QC from "../src/data/qc_backtest.json" (환율 봇 QuantConnect 재현 — 파일은 보존)
import KPG from "../src/data/kospi_pullback_gapshort.json";
import QCP from "../src/data/qc_backtest_kospi_pgs.json";
import NTD from "../src/data/kospi_noon_trendday.json";
import QCN from "../src/data/qc_backtest_kospi_ntd.json";
import MBL from "../src/data/kospi_morning_long.json";
import QCM from "../src/data/qc_backtest_kospi_mbl.json";
import NTL from "../src/data/kospi_noon_long.json";
import QCL from "../src/data/qc_backtest_kospi_ntl.json";
import ETFB from "../src/data/kospi_etf_book.json";
import EtfBookView from "../src/components/EtfBookView";
import CRB from "../src/data/crypto_btc_book.json";
import CryptoBookView, { CryptoSymbolTabs, CRYPTO_SYMBOLS } from "../src/components/CryptoBookView";
import NDXB from "../src/data/index_ndx_book.json";
import GOLD from "../src/data/commodity_gold_book.json";
import CommodityBookView from "../src/components/CommodityBookView";
import FXB from "../src/data/fx_fed_basket.json";
import FxBookView from "../src/components/FxBookView";
import { ldJson, ORG } from "../src/lib/jsonLd";
import SectionHead from "../src/components/ui/SectionHead";
import Panel, { Chip, LiveBadge } from "../src/components/ui/Panel";
// 2026-11-04 사용자 지시로 내림: import QcBacktestView from "../src/components/QcBacktestView" (환율 봇 카드 3 — 컴포넌트는 보존)
import KospiStrategyView from "../src/components/KospiStrategyView";
import StrategyRecord from "../src/components/StrategyRecord";

const SITE = "https://hyeongeonnoil.com";
const TITLE = "검증 기록 — 환율(연준 결정 뒤 달러 바스켓)·코스피200·나스닥100·크립토·금 전략의 1분봉 검증 | NewsInsight";
const DESC = "환율 며칠 보유 전략(연준 결정 뒤 달러 바스켓 5일), 지수(코스피200·나스닥100) 시간대 전략, 크립토(BTCUSDT) 시간대 전략, 원자재(금 XAUUSD) 시간대 전략의 검증 기록입니다. 연준 결정 뒤 달러 바스켓 전략은 여섯 쌍 교차 확인과 사건 이동 대조로, 금은 개발 구간과 독립 검증 구간을 나눠서, 코스피200 선물 전략은 QuantConnect 재현까지 포함해 1분봉 검증 결과와 그 한계를 함께 적었습니다.";

const PAGE_LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebPage", name: "검증 기록 — 환율·지수·크립토·금 전략 검증", url: `${SITE}/verified`, description: DESC, inLanguage: "ko",
      isPartOf: { "@type": "WebSite", name: "현건노일 NewsInsight", url: SITE }, publisher: ORG, dateModified: V.updated },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "검증 기록", item: `${SITE}/verified` } ] },
  ],
};

const wrap = { maxWidth: 1100, margin: "0 auto", padding: "8px 16px 40px" };
const p = { lineHeight: 1.8, fontSize: "var(--fs-md)", margin: "0 0 10px", color: "var(--text-2)" };

// 기본 탭 '환율'(key fx, /verified 또는 ?tab=fx) = 연준 결정 뒤 달러 바스켓. 예전 '환율 봇' 카드 1~3은 2026-11-04 사용자 지시로 내림.
const TABS = [
  { key: "fx", label: "환율", icon: "💱" },
  { key: "index", label: "지수", icon: "📈" },
  { key: "crypto", label: "크립토", icon: "₿" },
  { key: "commodity", label: "원자재", icon: "🥇" },
];
// 원자재 탭(2026-11-04): ?tab=commodity[&cm=gold] — 금(XAUUSD) 책 G1. 은·원유는 검증에서 탈락해 아직 없음(COMMOD_SESSION.md).
const COMMODITIES = [
  { key: "gold", label: "금 (XAUUSD)" },
];
const INDEXES = [
  { key: "kospi", label: "코스피200" },
  { key: "ndx", label: "나스닥100" },
];

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

// 지수 탭 안의 종목 탭 — 크립토 종목 탭과 같은 생김새. 코스피200이 기본(?tab=index), 나스닥100은 &idx=ndx.
function IndexTabs({ idx }) {
  return (
    <div className="cat-tabs" role="tablist" aria-label="지수 종목">
      {INDEXES.map((x) => {
        const on = idx === x.key;
        return (
          <Link key={x.key} href={{ pathname: "/verified", query: x.key === "kospi" ? { tab: "index" } : { tab: "index", idx: x.key } }} shallow scroll={false}
            role="tab" aria-selected={on} className={`cat-tab${on ? " is-on" : ""}`}>
            {x.label}
          </Link>
        );
      })}
    </div>
  );
}

function CommodityTabs({ cm }) {
  return (
    <div className="cat-tabs" role="tablist" aria-label="원자재 종목">
      {COMMODITIES.map((x) => {
        const on = cm === x.key;
        return (
          <Link key={x.key} href={{ pathname: "/verified", query: x.key === "gold" ? { tab: "commodity" } : { tab: "commodity", cm: x.key } }} shallow scroll={false}
            role="tab" aria-selected={on} className={`cat-tab${on ? " is-on" : ""}`}>
            {x.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function VerifiedPage() {
  const router = useRouter();
  const qt = router.query?.tab;
  // 예전 링크 ?tab=kospi → 지수 › 코스피200
  const tab = ["index", "kospi", "ndx"].includes(qt) ? "index" : qt === "crypto" ? "crypto" : qt === "commodity" ? "commodity" : "fx";
  const cm = "gold";
  const idx = router.query?.idx === "ndx" || qt === "ndx" ? "ndx" : "kospi";
  const sym = CRYPTO_SYMBOLS.includes(router.query?.sym) ? router.query.sym : "BTCUSDT";
  const s10 = KPG.stats_10y;
  const kp = V.kospi_pgs;
  const hasPgsQc = Boolean(kp && QCP?.stats);
  const kn = V.kospi_ntd;
  const hasNtdQc = Boolean(kn && QCN?.stats);
  const km = V.kospi_mbl;
  const hasMblQc = Boolean(km && QCM?.stats);
  const kl = V.kospi_ntl;
  const hasNtlQc = Boolean(kl && QCL?.stats);
  const hasEtfBook = Boolean(ETFB?.strategies?.length);
  // 환율 목차 = 연준 결정 뒤 달러 바스켓(FX1). 예전 환율 봇 카드 1~3(FX Blue·Myfxbook·QuantConnect 17셀) 목차는 2026-11-04 사용자 지시로 내림.
  const fs = FXB.strategies || [];
  const tocFx = fs.map((s, i) => ({ id: `${FXB.id_prefix}-${s.id.toLowerCase()}`, n: i + 1, src: `${s.side} · 자체 엔진 · 환율 CFD 1분봉`, title: `${s.id} ${s.name}`, level: "자체 엔진 · 공개 데이터 · 독립 검증 구간 없음(6쌍 교차 확인)", color: "var(--warn)",
    fact: [`${s.stats.basket.window.replace(/ /g, "")} ${s.stats.basket.n}건 · 바스켓 건당 ${pct(s.stats.basket.exp_pct)}`, `승률 ${s.stats.basket.win_rate}%`, `GBPUSD 단독 건당 ${pct(s.stats.single.exp_pct)}`, `낙폭 −${s.stats.basket.mdd_pct}% · 양수 ${s.stats.basket.pos_years}/${s.stats.basket.years}년`] }));
  const tocKospi = [
    { id: "v-kospi-pgs", n: 1, src: hasPgsQc ? "QuantConnect" : "자체 엔진 · 크레온 1분봉", title: `선물 전략 1 — ${KPG.name}`, level: hasPgsQc ? "외부 엔진 · 자체 데이터" : "자체 엔진 · 자체 데이터", color: "var(--warn)",
      fact: hasPgsQc ? [kp.period, `${QCP.three_way?.qc?.n}건 · 건당 ${pct(QCP.three_way?.qc?.mean)}`, `순이익 ${pct(QCP.stats.net_profit_pct)}`, `낙폭 −${QCP.stats.max_dd_pct}%`]
                     : [KPG.period, `${s10.n}건 · 건당 ${pct(s10.exp_pct)}`, `총 ${pct(s10.total_pct)}`, `낙폭 −${s10.mdd_pct}%`] },
    { id: "v-kospi-ntd", n: 2, src: hasNtdQc ? "QuantConnect" : "자체 엔진 · 크레온 1분봉", title: `선물 전략 2 — ${NTD.name}`, level: hasNtdQc ? "외부 엔진 · 자체 데이터" : "자체 엔진 · 자체 데이터", color: "var(--warn)",
      fact: hasNtdQc ? [kn.period, `${QCN.three_way?.qc?.n}건 · 건당 ${pct(QCN.three_way?.qc?.mean)}`, `순이익 ${pct(QCN.stats.net_profit_pct)}`, `낙폭 −${QCN.stats.max_dd_pct}%`]
                     : [NTD.period, `${NTD.stats_10y.n}건 · 건당 ${pct(NTD.stats_10y.exp_pct)}`, `총 ${pct(NTD.stats_10y.total_pct)}`, `낙폭 −${NTD.stats_10y.mdd_pct}%`] },
    { id: "v-kospi-mbl", n: 3, src: hasMblQc ? "QuantConnect" : "자체 엔진 · 크레온 1분봉", title: `선물 전략 3 — ${MBL.name}`, level: hasMblQc ? "외부 엔진 · 자체 데이터" : "자체 엔진 · 자체 데이터", color: "var(--warn)",
      fact: hasMblQc ? [km.period, `${QCM.three_way?.qc?.n}건 · 건당 ${pct(QCM.three_way?.qc?.mean)}`, `순이익 ${pct(QCM.stats.net_profit_pct)}`, `낙폭 −${QCM.stats.max_dd_pct}%`]
                     : [MBL.period, `${MBL.stats_10y.n}건 · 건당 ${pct(MBL.stats_10y.exp_pct)}`, `총 ${pct(MBL.stats_10y.total_pct)}`, `낙폭 −${MBL.stats_10y.mdd_pct}%`] },
    { id: "v-kospi-ntl", n: 4, src: hasNtlQc ? "QuantConnect" : "자체 엔진 · 크레온 1분봉", title: `선물 전략 4 — ${NTL.name}`, level: hasNtlQc ? "외부 엔진 · 자체 데이터" : "자체 엔진 · 자체 데이터", color: "var(--warn)",
      fact: hasNtlQc ? [kl.period, `${QCL.three_way?.qc?.n}건 · 건당 ${pct(QCL.three_way?.qc?.mean)}`, `순이익 ${pct(QCL.stats.net_profit_pct)}`, `낙폭 −${QCL.stats.max_dd_pct}%`]
                     : [NTL.period, `${NTL.stats_10y.n}건 · 건당 ${pct(NTL.stats_10y.exp_pct)}`, `총 ${pct(NTL.stats_10y.total_pct)}`, `낙폭 −${NTL.stats_10y.mdd_pct}%`] },
    ...(hasEtfBook ? [{ id: "v-kospi-etf", n: 5, src: "ETF 시세 재산정", title: "ETF 전용 책 — 4전략 실계좌 집행", level: "자체 엔진 · ETF 실제 시세", color: "var(--cyan)",
      fact: [`실계좌 ${ETFB.live_since}~`, `${ETFB.book.n}건 · 합계 ${pct(ETFB.book.total_pct)}`, `낙폭 −${ETFB.book.mdd_pct}%`, ETFB.book.window] }] : []),
  ];
  const cs = CRB.strategies || [];
  const tocCrypto = sym !== CRB.symbol ? [] : [
    ...cs.map((s, i) => ({ id: `v-crypto-${s.id.toLowerCase()}`, n: i + 1, src: `${s.side} · 자체 엔진 · 바이비트 1분봉`, title: `${CRB.symbol} — ${s.name}`, level: "자체 엔진 · 공개 데이터", color: "var(--warn)",
      fact: [s.period, `${s.n}건 · 건당 ${pct(s.exp_pct)}`, `1배 누적 ${pct(s.total_pct)}`, `낙폭 −${s.mdd_pct}%`] })),
    { id: "v-crypto-book", n: cs.length + 1, src: `${cs.length}개 전략 합산`, title: "한 계좌 운용 · 레버리지", level: "자체 엔진 · 공개 데이터", color: "var(--cyan)",
      fact: [`${CRB.book.n}건`, ...(CRB.book.leverage || []).slice(0, 2).map((r) => `${r.lev}배 연 ${pct(r.cagr_pct)} · 낙폭 −${r.mdd_pct}%`)] },
  ];
  const ns = NDXB.strategies || [];
  const tocNdx = [
    ...ns.map((s, i) => ({ id: `${NDXB.id_prefix}-${s.id.toLowerCase()}`, n: i + 1, src: `${s.side} · 자체 엔진 · 지수 CFD 1분봉`, title: `${s.id} ${s.name}`, level: "자체 엔진 · 공개 데이터", color: "var(--warn)",
      fact: [s.period, `${s.n}건 · 건당 ${pct(s.exp_pct)}`, `승률 ${s.win_rate}%`, `낙폭 −${s.mdd_pct}%`] })),
    { id: `${NDXB.id_prefix}-book`, n: ns.length + 1, src: `${ns.length}개 전략 합산`, title: "한 계좌 운용 · 레버리지", level: "자체 엔진 · 공개 데이터", color: "var(--cyan)",
      fact: [`${NDXB.book.n}건`, ...(NDXB.book.leverage || []).slice(0, 2).map((r) => `${r.lev}배 연 ${pct(r.cagr_pct)} · 낙폭 −${r.mdd_pct}%`)] },
  ];
  const gs = GOLD.strategies || [];
  const tocGold = gs.map((s, i) => ({ id: `${GOLD.id_prefix}-${s.id.toLowerCase()}`, n: i + 1, src: `${s.side} · 자체 엔진 · 금 CFD 1분봉`, title: `${s.id} ${s.name}`, level: "자체 엔진 · 공개 데이터 · 독립 검증 구간 통과", color: "var(--warn)",
    fact: [`검증 ${s.stats.oos.window.replace(/ /g, "")} ${s.stats.oos.n}건 · 건당 +${s.stats.oos.exp_pct.toFixed(3)}%`, `승률 ${s.stats.oos.win_rate}%`, `개발 ${s.stats.dev.n}건 · 건당 +${s.stats.dev.exp_pct.toFixed(3)}%`, `1배 연 +${s.stats.oos.annual_pct.toFixed(1)}%`] }));
  const toc = tab === "index" ? (idx === "ndx" ? tocNdx : tocKospi) : tab === "crypto" ? tocCrypto : tab === "commodity" ? tocGold : tocFx;
  const kospi = tab === "index" && idx === "kospi";
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
      {tab === "index" && <div style={{ padding: "0 8px 12px" }}><IndexTabs idx={idx} /></div>}

      {/* 예전 환율 봇 안내문(데모 계좌·FX 현황 대조)은 2026-11-04 사용자 지시로 내림 */}
      {/* 수치 출처: reversion_research/backtests/kospi_universe_profile.py (2026-11-02, 선물 1분봉 2016-08~2026-10) */}
      {kospi && (
        <ul style={{ ...p, padding: "0 8px 0 28px", display: "grid", gap: 2 }}>
          <li><strong>코스피200은 밤에 오르고 낮에는 제자리입니다</strong> (2016년 이후 밤 +179%, 낮 −20%).</li>
          <li>낮의 수익은 정오에 한쪽으로 크게 기운 날처럼 특정 조건에서만 나옵니다.</li>
          <li>2026년은 변동폭이 2017년의 5배인 이례적인 해라, 조용한 장에서는 기회가 줄어듭니다.</li>
        </ul>
      )}

      <div style={{ display: "grid", gap: 16, padding: "0 8px" }}>
        {tab === "crypto" && <CryptoSymbolTabs sym={sym} ready={[CRB.symbol]} />}
        {tab === "commodity" && <CommodityTabs cm={cm} />}
        {toc.length > 0 && <Toc items={toc} />}

        {/* 환율 — 연준 결정 뒤 달러 바스켓(FX1). 예전 카드 1~3(FX Blue 현황판·Myfxbook 배지·QuantConnect 17셀 재현)은 2026-11-04 사용자 지시로 내림
            (QcBacktestView·qc_backtest.json·verified.json 의 fxblue/myfxbook/quantconnect 항목은 보존). */}
        {tab === "fx" && <FxBookView data={FXB} />}

        {kospi && (
          <>
            {/* 선물 전용 책 / ETF 전용 책 구분 (11/2) */}
            <p style={{ ...p, padding: "4px 8px 0", margin: 0 }}>
              <strong>1~4번은 선물 전용 책</strong>입니다. 코스피200 지수선물로 거래할 때의 규칙과 기록이고, 미니선물 1계약 기준입니다.{" "}
              {hasEtfBook && <><strong>5번은 ETF 전용 책</strong>으로, 같은 신호를 KODEX 200·KODEX 인버스로 집행하며 실계좌에서 돌아갑니다.</>}
            </p>

            {/* 코스피 2. 선물 전략 1 — 눌림 갭업 숏: 전략 / 그래프(QuantConnect) / 성과 세 덩어리, 나머지는 '자세히' */}
            <SectionHead id="v-kospi-pgs" aside={<TopLink />} kicker="KOSPI FUTURES · STRATEGY 1" title={`1. 선물 전략 1 — 「${KPG.name}」`}
              desc={hasPgsQc ? "네 조건이 모두 맞는 날만 숏, 손절 또는 마감 청산. 그래프와 성과는 QuantConnect(LEAN) 엔진 재현 기준(5년 1분봉)입니다." : `${KPG.market}. 자체 엔진·자체 데이터 결과입니다.`} />
            {hasPgsQc ? <StrategyRecord kpg={KPG} qc={QCP} meta={kp} /> : <KospiStrategyView data={KPG} />}

            {/* 코스피 3. 선물 전략 2 — 정오 추세일 숏 */}
            <SectionHead id="v-kospi-ntd" aside={<TopLink />} kicker="KOSPI FUTURES · STRATEGY 2" title={`2. 선물 전략 2 — 「${NTD.name}」`}
              desc={hasNtdQc ? "11:30에 개장가·전일 종가보다 충분히 밀려 저점 근처에 있으면 숏, 손절 또는 마감 청산. 그래프와 성과는 QuantConnect(LEAN) 엔진 재현 기준(5년 1분봉)입니다." : `${NTD.market}. 자체 엔진·자체 데이터 결과입니다.`} />
            {hasNtdQc ? <StrategyRecord kpg={NTD} qc={QCN} meta={kn} /> : <KospiStrategyView data={NTD} />}

            {/* 코스피 4. 선물 전략 3 — 아침 반등 롱 */}
            <SectionHead id="v-kospi-mbl" aside={<TopLink />} kicker="KOSPI FUTURES · STRATEGY 3" title={`3. 선물 전략 3 — 「${MBL.name}」`}
              desc={hasMblQc ? "변동성 장세에서 지난주 매수자 대부분이 물린 채 갭다운으로 열린 날, 09:00 매수 → 10:30 매도. 손절 없음. 그래프와 성과는 QuantConnect(LEAN) 엔진 재현 기준(5년 1분봉)입니다." : `${MBL.market}. 자체 엔진·자체 데이터 결과입니다.`} />
            {hasMblQc ? <StrategyRecord kpg={MBL} qc={QCM} meta={km} side="롱 · 하루 1회 · 90분" /> : <KospiStrategyView data={MBL} />}

            {/* 코스피 5. 선물 전략 4 — 정오 추세일 롱 (정오 추세일 숏의 거울) */}
            <SectionHead id="v-kospi-ntl" aside={<TopLink />} kicker="KOSPI FUTURES · STRATEGY 4" title={`4. 선물 전략 4 — 「${NTL.name}」`}
              desc={hasNtlQc ? "변동성 장세에서 11:30~12:30 사이 오늘·어제 매수자가 모두 수익이고 오전 저점에서 하루치를 올라와 고가 근처에 있으면 매수, 마감 청산. 그래프와 성과는 QuantConnect(LEAN) 엔진 재현 기준(5년 1분봉)입니다." : `${NTL.market}. 자체 엔진·자체 데이터 결과입니다.`} />
            {hasNtlQc ? <StrategyRecord kpg={NTL} qc={QCL} meta={kl} side="롱 · 하루 1회 · 오후 보유" /> : <KospiStrategyView data={NTL} />}

            {/* 코스피 6. ETF 전용 책 — 같은 신호, ETF 체결 (11/2 분리) */}
            {hasEtfBook && (
              <>
                <SectionHead id="v-kospi-etf" aside={<TopLink />} kicker="KOSPI ETF BOOK · LIVE" title={`5. ETF 전용 책 — 4전략 실계좌 집행`}
                  desc="위 선물 전략 네 개를 KODEX 200·KODEX 인버스로 집행하는 버전입니다. 신호는 같고, 아침 반등 롱만 ETF에 맞게 진입 방식을 바꿨습니다. 결과는 ETF 실제 시세로 다시 계산한 값입니다." />
                <EtfBookView data={ETFB} />
              </>
            )}
          </>
        )}

        {tab === "index" && idx === "ndx" && <CryptoBookView data={NDXB} />}

        {tab === "crypto" && <CryptoBookView data={CRB} sym={sym} />}

        {tab === "commodity" && cm === "gold" && <CommodityBookView data={GOLD} />}
      </div>

      <p className="meta" style={{ padding: "16px 8px 0", lineHeight: 1.7 }}>
        이 페이지는 투자 권유가 아닙니다. 환율(연준 결정 뒤 달러 바스켓) 기록은 독립 검증 구간이 없는 자체 백테스트(2015~2026 전 구간을 보고 찾은 규칙, 여섯 쌍 교차 확인만)이며 페이퍼로 관찰하는 중입니다. 코스피 선물 전략은 실거래 전의 자체 백테스트(QuantConnect 재현 포함)이고, 코스피 ETF 전용 책은 같은 신호를 ETF 시세로 다시 계산한 기록이며 2026-11-02부터 소액 실계좌에서 돌아갑니다. 나스닥100 기록과 크립토 기록은 실거래 전의 자체 백테스트입니다. 원자재(금) 기록은 개발 구간과 독립 검증 구간을 나눈 자체 백테스트이며, 실거래 전에 페이퍼로 체결을 확인하는 중입니다.
        실제 성과·수수료·슬리피지는 다를 수 있습니다.
        월간·주간 자체 보고서는 <Link href="/reports" style={{ color: "var(--cyan)" }}>보고서</Link>에서 볼 수 있습니다.
      </p>
    </div>
  );
}
