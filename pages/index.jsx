import dynamic from "next/dynamic";
import Head from "next/head";
import Seo from "../src/components/Seo";
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

// (2026-10-27) 맨 위 소개 띠(사이트 설명·오늘의 브리핑·세계 뉴스 링크·시세 칩)를 없앴다 — 화면이 히어로로 바로 시작한다.
// 페이지의 h1 은 화면 밖(.sr-only)에 남겨 검색엔진·스크린리더만 읽는다. 히어로 제목은 h2 그대로.
export default function HomePage() {
  return (
    <>
      <Seo title="현건노일 NewsInsight — 환율·지수·코인 시세와 뉴스 대시보드" description={DESC} path="/" />
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(WEBSITE_LD) }} />
      </Head>
      <h1 className="sr-only">현건노일 NewsInsight — 세계 뉴스 요약과 시세 대시보드</h1>
      <Home />
    </>
  );
}
