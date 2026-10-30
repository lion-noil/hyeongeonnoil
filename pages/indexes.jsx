import dynamic from "next/dynamic";
import Seo from "../src/components/Seo";
import { HubIntro, HubGuide } from "../src/components/HubSummary";
import { HUBS } from "../src/lib/hubContent";
import { hubStaticProps } from "../src/lib/hubDb";
import ChartPreload from "../src/components/ChartPreload";
const Indexes = dynamic(() => import("../src/pages/Indexes"), { ssr: false });

export default function IndexesPage({ hub }) {
  const H = HUBS.indexes;
  return (
    <>
      <Seo title={H.seo.title} description={H.seo.description} path={H.path} />
      {/* 서버렌더 본문(2026-10-18) — 차트는 ssr:false 라 크롤러용 텍스트(h1·최근 종가·읽는 법·FAQ)를 위아래로 제공 */}
      <HubIntro hubKey="indexes" hub={hub} />
      <ChartPreload cats={["index"]} />
      <Indexes />
      <HubGuide hubKey="indexes" hub={hub} />
    </>
  );
}

// 숫자는 chart_data 일봉·최신 브리핑에서 10분 ISR(src/lib/hubDb.js). 오류 시 설명·링크·FAQ 만 렌더.
export async function getStaticProps() {
  return hubStaticProps("indexes");
}
