import dynamic from "next/dynamic";
import Seo from "../src/components/Seo";
import SeoSummary from "../src/components/SeoSummary";
import { getLatestCloses } from "../src/lib/chartSummaryDb";
const Indexes = dynamic(() => import("../src/pages/Indexes"), { ssr: false });

export default function IndexesPage({ rows = [] }) {
  return (
    <>
      <Seo
        title="세계 주가지수 차트 | NewsInsight"
        description="미국·아시아·유럽 주요 주가지수 시세와 변동 흐름을 확인하는 무료 차트 대시보드입니다."
        path="/indexes"
      />
      {/* 서버렌더 요약 — 차트는 ssr:false 라 크롤러용 텍스트(최근 종가)를 여기서 제공 */}
      <SeoSummary
        title="세계 주가지수 차트"
        paragraphs={[
          "미국 나스닥100, 일본 닛케이225, 중국 상하이A, 홍콩 항셍, 인도 BSE30, 한국 코스피200, 유로스톡스50, 독일 DAX 등 주요 주가지수를 일봉으로 보여줍니다.",
          "각 차트에는 100일 이동평균과 ±10% 엔벨로프가 함께 그려져 최근 종가가 평균 대비 어느 위치인지 볼 수 있습니다. 시세는 매시 갱신되며 정보 제공 목적입니다.",
        ]}
        rows={rows}
      />
      <Indexes />
    </>
  );
}

// 최근 종가 목록 — chart_data 해시(index)에서 10분 ISR. 오류 시 설명만 렌더.
export async function getStaticProps() {
  try {
    const rows = await getLatestCloses(["index"]);
    return { props: { rows }, revalidate: 600 };
  } catch {
    return { props: { rows: [] }, revalidate: 120 };
  }
}
