// /market/[slug]·/en/market/[slug] 공용 getStaticProps 본체 — 페이지 파일 간 import 를 피하기 위해 분리. (2026-10-09)
import { TOPIC_BY_SLUG } from "./marketTopics";
import { getTopicData, getMarketOverview } from "./marketDataDb";
import { getLatestBriefing, briefingExcerpt } from "./briefingDb";

export async function loadTopicProps(slug, lang) {
  const topic = TOPIC_BY_SLUG[slug];
  if (!topic) return { notFound: true };
  try {
    const [data, overview, latest] = await Promise.all([
      getTopicData(slug),
      getMarketOverview().catch(() => []),
      getLatestBriefing().catch(() => null),
    ]);
    if (!data) return { notFound: true, revalidate: 1800 }; // 빈 시리즈(예: natural_gas) — 데이터가 들어오면 30분 뒤 생성
    return {
      props: { topic, data, others: overview, briefing: briefingExcerpt(latest, topic.section, lang) },
      revalidate: 1800,
    };
  } catch {
    return { notFound: true, revalidate: 60 };
  }
}
