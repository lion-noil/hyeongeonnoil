import dynamic from "next/dynamic";
import Seo from "../src/components/Seo";
import SeoSummary from "../src/components/SeoSummary";
import { getLatestCloses } from "../src/lib/chartSummaryDb";
const Commodity = dynamic(() => import("../src/pages/Commodity"), { ssr: false });

export default function CommodityPage({ rows = [] }) {
  return (
    <>
      <Seo
        title="원자재 시세 차트 — 금·은·원유 | NewsInsight"
        description="금, 은, 원유 등 주요 원자재 시세 흐름을 확인하는 무료 차트 대시보드입니다."
        path="/commodity"
      />
      {/* 서버렌더 요약 — 차트는 ssr:false 라 크롤러용 텍스트(최근 종가)를 여기서 제공 */}
      <SeoSummary
        title="원자재 시세 차트"
        paragraphs={[
          "금, 원유(WTI), 천연가스, 옥수수, 커피, 밀, 생우 등 주요 원자재 선물 시세를 일봉으로 보여줍니다.",
          "각 차트에는 100일 이동평균과 ±10% 엔벨로프가 함께 그려져 최근 종가가 평균 대비 어느 위치인지 볼 수 있습니다. 시세는 매시 갱신되며 정보 제공 목적입니다.",
        ]}
        rows={rows}
      />
      <Commodity />
    </>
  );
}

// 최근 종가 목록 — chart_data 해시(commodity)에서 10분 ISR. 오류 시 설명만 렌더.
export async function getStaticProps() {
  try {
    const rows = await getLatestCloses(["commodity"]);
    return { props: { rows }, revalidate: 600 };
  } catch {
    return { props: { rows: [] }, revalidate: 120 };
  }
}
