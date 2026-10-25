// 검증 기록 — 환율 유니버스 봇의 제3자 검증 기록 모음 (2026-10-19, 2026-10-25 디자인 시스템 + QuantConnect 자체 호스팅)
// 1) FX Blue 실시간 현황판(Publisher EA 발행) 2) Myfxbook 검증 배지(투자자 비번 직접 접속)
// 3) QuantConnect 독립 엔진·데이터 백테스트 — 공개 임베드(quantconnect.cloud)가 자주 죽어, 결과 원본을 API로 내려받아
//    src/data/qc_backtest.json 에 두고 QcBacktestView 가 직접 그린다 (reversion_research/platforms/quantconnect/qc_fetch_result.py → build_verified_data.py).
// 숫자·링크·주의문은 src/data/verified.json (publish_site.py 가 갱신). 정적 페이지.
import Head from "next/head";
import Link from "next/link";
import V from "../src/data/verified.json";
import QC from "../src/data/qc_backtest.json";
import { ldJson, ORG } from "../src/lib/jsonLd";
import SectionHead from "../src/components/ui/SectionHead";
import Panel, { Chip, LiveBadge } from "../src/components/ui/Panel";
import QcBacktestView from "../src/components/QcBacktestView";

const SITE = "https://hyeongeonnoil.com";
const TITLE = "검증 기록 — 환율 자동매매 봇의 제3자 검증(FX Blue·Myfxbook·QuantConnect) | NewsInsight";
const DESC = "환율 7종 자동매매 봇(MT5 데모)의 외부 검증 기록입니다. FX Blue 실시간 현황판, Myfxbook 검증 배지, QuantConnect 독립 백테스트의 자본곡선·월별·셀별 결과와 그 한계를 함께 적었습니다.";

const PAGE_LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebPage", name: "검증 기록 — 환율 자동매매 봇의 제3자 검증", url: `${SITE}/verified`, description: DESC, inLanguage: "ko",
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

export default function VerifiedPage() {
  const q = V.quantconnect;
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
        {V.account.label}에서 돌아가는 봇의 기록입니다. 사이트의 <Link href="/reports" style={{ color: "var(--cyan)" }}>보고서</Link>와{" "}
        <Link href="/fx" style={{ color: "var(--cyan)" }}>FX 현황</Link>은 자체 장부 기준이고, 이 페이지는 그 장부를 바깥에서 대조하는 용도입니다.
        {" "}{V.account.note} 가동 {V.account.live_since}~.
      </p>

      <div style={{ display: "grid", gap: 16, padding: "0 8px" }}>
        {/* 1. FX Blue */}
        <Panel icon="📡" title="1. 실시간 현황판 — FX Blue" meta={`공개 사용자명 ${V.fxblue.user} · 발행 시작 ${V.fxblue.since}`}
          footer={<><Ext href={V.fxblue.stats_url}>FX Blue 통계 페이지</Ext><Ext href={V.fxblue.page_url}>거래 내역</Ext></>}>
          <p style={p}>{V.fxblue.how}</p>
          <iframe src={V.fxblue.chart_embed} title="FX Blue 누적 손익 차트" loading="lazy" style={{ ...frame, height: 240 }} />
        </Panel>

        {/* 2. Myfxbook */}
        <Panel icon="🛡️" title="2. 검증 배지 — Myfxbook" meta={`연결 ${V.myfxbook.since}`}
          badge={<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{V.myfxbook.badges.map((b) => <Chip key={b} color="var(--ok)">✓ {b}</Chip>)}</div>}
          footer={<Ext href={V.myfxbook.url}>Myfxbook 계좌 페이지</Ext>}>
          <p style={{ ...p, margin: 0 }}>{V.myfxbook.how} 거래 이력은 연결 뒤 동기화된 분부터 쌓입니다.</p>
        </Panel>

        {/* 3. QuantConnect — 자체 호스팅 */}
        <SectionHead kicker="INDEPENDENT BACKTEST" title="3. 독립 엔진·데이터 재현 — QuantConnect"
          desc="같은 규칙(환율 셀 17개, 라이브와 동일한 사이징)을 LEAN 엔진용으로 다시 구현해 다른 데이터·다른 엔진·다른 체결 모델로 돌린 결과" />
        <p style={p}>
          {q.cell_match}. 기간 {q.period}, 실행 {q.run_at}, {q.engine}. 결과 원본(자본곡선·월별 통계·청산 거래 {QC.stats.closed_trades}건)은
          QuantConnect API에서 내려받아 이 사이트가 직접 그립니다 — 외부 공개 페이지가 접속되지 않아도 아래는 그대로 봅니다.
          {q.code_note ? ` ${q.code_note}` : ""}
        </p>
        <QcBacktestView data={QC} caveats={q.caveats} expectation={q.expectation} />
      </div>

      <p className="meta" style={{ padding: "16px 8px 0", lineHeight: 1.7 }}>
        이 페이지는 투자 권유가 아닙니다. 모든 기록은 데모 계좌이며, 실계좌 성과·수수료·슬리피지는 다를 수 있습니다.
        월간·주간 자체 보고서는 <Link href="/reports" style={{ color: "var(--cyan)" }}>보고서</Link>에서 볼 수 있습니다.
      </p>
    </div>
  );
}
