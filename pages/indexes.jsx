import dynamic from "next/dynamic";
import Seo from "../src/components/Seo";
import { HubIntro } from "../src/components/HubSummary";
import { HUBS } from "../src/lib/hubContent";
import { hubStaticProps } from "../src/lib/hubDb";
import ChartPreload from "../src/components/ChartPreload";
const Indexes = dynamic(() => import("../src/pages/Indexes"), { ssr: false });

export default function IndexesPage({ hub }) {
  const H = HUBS.indexes;
  return (
    <>
      <Seo title={H.seo.title} description={H.seo.description} path={H.path} />
      {/* 서버렌더 h1(HubIntro, 화면 밖). 하단 '읽는 법·FAQ'(HubGuide)는 2026-10-30 사용자 요청으로 뺌 */}
      <HubIntro hubKey="indexes" hub={hub} />
      <ChartPreload cats={["index"]} />
      <Indexes />
    </>
  );
}

// 숫자는 chart_data 일봉·최신 브리핑에서 10분 ISR(src/lib/hubDb.js). 오류 시 설명·링크·FAQ 만 렌더.
export async function getStaticProps() {
  return hubStaticProps("indexes");
}
