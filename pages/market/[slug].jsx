// 시세 키워드 상시 페이지(한국어) — /market/usd-krw 등. 정의는 src/lib/marketTopics.js, 렌더는 MarketTopicPage. (2026-10-09)
// ISR 30분. 데이터 없는 심볼(예: natural_gas 빈 시리즈)은 404 + 30분 뒤 재시도.
import MarketTopicPage from "../../src/components/MarketTopicPage";
import { loadTopicProps } from "../../src/lib/marketPageProps";

export default function MarketSlugPage(props) {
  return <MarketTopicPage lang="ko" {...props} />;
}

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  return loadTopicProps(String(params.slug || ""), "ko");
}
