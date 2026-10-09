// 시세 목록(한국어) — 전 키워드 페이지 카드(최근 종가·전일 대비). (2026-10-09)
import { MarketIndexPage } from "../../src/components/MarketTopicPage";
import { getMarketOverview } from "../../src/lib/marketDataDb";

export default function MarketIndex({ overview }) {
  return <MarketIndexPage lang="ko" overview={overview} />;
}

export async function getStaticProps() {
  try {
    return { props: { overview: await getMarketOverview() }, revalidate: 1800 };
  } catch {
    return { props: { overview: [] }, revalidate: 300 };
  }
}
