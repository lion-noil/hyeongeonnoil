import Seo from "../src/components/Seo";
import { HubIntro, HubGuide } from "../src/components/HubSummary";
import { HUBS } from "../src/lib/hubContent";
import { hubStaticProps } from "../src/lib/hubDb";

// 기타 = 사이트 안내·바로가기 (2026-10-18) — 예전 '준비 중' 자리표시(src/pages/Others.jsx, 본문 223자·색인 안 됨)를
// 서버렌더 안내로 교체: 시세 페이지 전체의 최근 종가·전일 대비 + 각 섹션 설명 + FAQ.
export default function OthersPage({ hub }) {
  const H = HUBS.others;
  return (
    <>
      <Seo title={H.seo.title} description={H.seo.description} path={H.path} />
      <HubIntro hubKey="others" hub={hub} />
      <HubGuide hubKey="others" hub={hub} />
    </>
  );
}

export async function getStaticProps() {
  return hubStaticProps("others");
}
