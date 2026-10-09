// Market topic page (English) — same data as /market/[slug], English copy. (2026-10-09)
import MarketTopicPage from "../../../src/components/MarketTopicPage";
import { loadTopicProps } from "../../../src/lib/marketPageProps";

export default function MarketSlugPageEn(props) {
  return <MarketTopicPage lang="en" {...props} />;
}

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  return loadTopicProps(String(params.slug || ""), "en");
}
