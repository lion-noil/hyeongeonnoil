import dynamic from "next/dynamic";
import Seo from "../src/components/Seo";
import SeoSummary from "../src/components/SeoSummary";
import { getLatestCloses } from "../src/lib/chartSummaryDb";
const Exchange = dynamic(() => import("../src/pages/Exchange"), { ssr: false });

export default function ExchangePage({ rows = [] }) {
  return (
    <>
      <Seo
        title="환율·채권 차트 — 달러 환율과 국채 금리 | NewsInsight"
        description="원달러 환율 등 주요 통화 환율과 국채 금리 흐름을 한 화면에서 보는 무료 차트 대시보드입니다."
        path="/exchange"
      />
      {/* 서버렌더 요약 — 차트는 ssr:false 라 크롤러용 텍스트(최근 종가)를 여기서 제공 */}
      <SeoSummary
        title="환율·채권 금리 차트"
        paragraphs={[
          "달러 인덱스와 원·엔·위안·홍콩달러·유로·파운드·루피·바트·동·싱가포르달러의 1달러 기준 환율, 미국 10년·일본 10년·한국 3년 국채 금리를 일봉으로 보여줍니다.",
          "각 차트에는 100일 이동평균과 ±3% 엔벨로프가 함께 그려져 최근 종가가 평균 대비 어느 위치인지 한눈에 볼 수 있습니다. 시세는 매시 갱신되며 정보 제공 목적입니다.",
        ]}
        rows={rows}
      />
      <Exchange />
    </>
  );
}

// 최근 종가 목록 — chart_data 해시(currency·treasury)에서 10분 ISR. 오류 시 설명만 렌더.
export async function getStaticProps() {
  try {
    const rows = await getLatestCloses(["currency", "treasury"]);
    return { props: { rows }, revalidate: 600 };
  } catch {
    return { props: { rows: [] }, revalidate: 120 };
  }
}
