import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";
import Seo from "../src/components/Seo";
import SeoSummary from "../src/components/SeoSummary";
import { ldJson } from "../src/lib/jsonLd";
import { MARKET_TOPICS } from "../src/lib/marketTopics";
import { fmtNum, fmtDelta } from "../src/components/MarketTopicPage";
import { getLatestBriefing } from "../src/lib/briefingDb";
import { listAllDays } from "../src/lib/archiveDb";
import { getMarketOverview } from "../src/lib/marketDataDb";
const Home = dynamic(() => import("../src/pages/Home"), { ssr: false });

const DESC =
  "현건노일 NewsInsight — 환율·채권·주가지수·원자재·코인 시세 차트와 전략 시그널, 세계 뉴스 요약 아카이브를 한 화면에서 보는 무료 대시보드";

// WebSite JSON-LD — 사이트 이름·설명을 검색엔진에 명시 (2026-09-30)
const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "현건노일 NewsInsight",
  alternateName: "NewsInsight",
  url: "https://hyeongeonnoil.com",
  description: DESC,
  inLanguage: "ko",
  publisher: { "@type": "Organization", name: "현건노일 NewsInsight", url: "https://hyeongeonnoil.com" },
};

function kdate(day) {
  const [y, m, d] = String(day).split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

function TodayLinks({ briefing, archiveDay, market }) {
  if (!briefing && !archiveDay && !market?.length) return null;
  return (
    <nav aria-label="오늘의 글" className="links">
      {briefing && (
        <p>
          <span className="meta">오늘의 시장 브리핑 · </span>
          <Link href={`/briefing/${briefing.day}`}>{briefing.title}</Link>
          {briefing.lead ? <span className="meta"> — {String(briefing.lead).slice(0, 90)}…</span> : null}
        </p>
      )}
      {archiveDay && (
        <p>
          <span className="meta">오늘의 세계 뉴스 요약 · </span>
          <Link href={`/archive/${archiveDay}`}>{kdate(archiveDay)} 세계 뉴스 요약</Link>
          <span className="meta"> · <Link href="/archive" style={{ color: "var(--muted)" }}>전체 아카이브</Link></span>
        </p>
      )}
      {market?.length > 0 && (
        <>
          <p className="meta">
            <Link href="/market" style={{ color: "var(--text-2)" }}>시세 페이지</Link> (최근 종가 · 전일 대비)
          </p>
          <ul>
            {market.map((o) => {
              const t = MARKET_TOPICS.find((x) => x.slug === o.slug);
              if (!t) return null;
              const dir = o.delta > 0 ? "up" : o.delta < 0 ? "down" : "flat";
              return (
                <li key={o.slug}>
                  <Link href={`/market/${o.slug}`} className="chip">
                    {t.ko.seo} <b>{fmtNum(o.close, t.dec)}{t.kind === "rate" ? "%" : ""}</b> <span className={dir}>{fmtDelta(o.delta, t.kind)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </nav>
  );
}

export default function HomePage({ briefing = null, archiveDay = null, market = [] }) {
  return (
    <>
      <Seo title="현건노일 NewsInsight — 환율·지수·코인 시세와 뉴스 대시보드" description={DESC} path="/" />
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(WEBSITE_LD) }} />
      </Head>
      {/* 서버렌더 요약 — 홈 본문은 ssr:false 라 크롤러가 볼 수 있는 유일한 텍스트 */}
      <SeoSummary
        title="현건노일 NewsInsight — 세계 뉴스 요약과 시세 대시보드"
        paragraphs={[
          "매일 10개국(미국·중국·일본·인도·홍콩·한국·독일·영국·호주·사우디) 뉴스 방송을 한국어로 요약해 날짜별로 보관하고, 어제 세계 핵심 뉴스 5선과 나라별 분위기·관계를 담은 세계 정세 현황판을 보여줍니다.",
          "환율·채권 금리·주가지수·원자재·코인 시세 차트, 매일 아침 시장 브리핑, Bybit·MT5 자동매매 봇의 실계좌 성적과 보고서를 함께 제공합니다. 정보 제공 목적이며 투자 권유가 아닙니다.",
        ]}
      >
        <TodayLinks briefing={briefing} archiveDay={archiveDay} market={market} />
      </SeoSummary>
      <Home />
    </>
  );
}

// 최신 브리핑·최신 아카이브 날짜·시세 전 페이지 최근 종가 — 10분 ISR. 어느 원천이 실패해도 그 항목만 비우고 빌드는 통과.
export async function getStaticProps() {
  const [b, days, market] = await Promise.all([
    getLatestBriefing().catch(() => null),
    listAllDays().catch(() => []),
    getMarketOverview().catch(() => []),
  ]);
  return {
    props: {
      briefing: b && b.day && b.title ? { day: b.day, title: b.title, lead: b.lead || "" } : null,
      archiveDay: days[0] || null,
      market,
    },
    revalidate: 600,
  };
}
