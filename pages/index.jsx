import dynamic from "next/dynamic";
import Head from "next/head";
import Seo from "../src/components/Seo";
import SeoSummary from "../src/components/SeoSummary";
import { ldJson } from "../src/lib/jsonLd";
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

export default function HomePage() {
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
          "매일 8개국(미국·중국·일본·인도·홍콩·한국·독일·영국) 뉴스 방송을 한국어로 요약해 날짜별로 보관하고, 어제 세계 핵심 뉴스 5선과 나라별 분위기·관계를 담은 세계 정세 현황판을 보여줍니다.",
          "환율·채권 금리·주가지수·원자재·코인 시세 차트, 매일 아침 시장 브리핑, Bybit·MT5 자동매매 봇의 실계좌 성적과 보고서를 함께 제공합니다. 정보 제공 목적이며 투자 권유가 아닙니다.",
        ]}
      />
      <Home />
    </>
  );
}
