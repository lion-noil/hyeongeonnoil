// Markets index (English) — cards for every topic page with latest close and day change. (2026-10-09)
import { MarketIndexPage } from "../../../src/components/MarketTopicPage";
import { getMarketOverview } from "../../../src/lib/marketDataDb";

export default function MarketIndexEn({ overview }) {
  return <MarketIndexPage lang="en" overview={overview} />;
}

export async function getStaticProps() {
  try {
    return { props: { overview: await getMarketOverview() }, revalidate: 1800 };
  } catch {
    return { props: { overview: [] }, revalidate: 300 };
  }
}
