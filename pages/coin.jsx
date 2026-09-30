import dynamic from "next/dynamic";
import Seo from "../src/components/Seo";
import SeoSummary from "../src/components/SeoSummary";
const Coin = dynamic(() => import("../src/pages/Coin"), { ssr: false });

export default function CoinPage() {
  return (
    <>
      <Seo
        title="코인 시세와 자동매매 현황 — 비트코인 차트 | NewsInsight"
        description="비트코인 등 주요 코인 시세 차트와 Bybit 자동매매 실계좌 포지션·손익·매매 전적을 공개하는 대시보드입니다."
        path="/coin"
      />
      {/* 서버렌더 요약 — 본문은 ssr:false(실시간 WS 차트)라 설명만 제공 */}
      <SeoSummary
        title="코인 시세와 Bybit 자동매매 현황"
        paragraphs={[
          "비트코인·이더리움·XRP·솔라나 등 Bybit 선물 주요 코인의 1분·4시간·일봉 차트를 실시간으로 보여주고, 각 심볼에 적용된 진입 전략(z-score 밴드·추세)과 신호를 표시합니다.",
          "운영자 개인의 Bybit 실계좌 자동매매 포지션·평가액·손익과 매매 전적 통계를 그대로 공개합니다. 과거 성과가 미래를 보장하지 않으며 투자 권유가 아닙니다.",
        ]}
      />
      <Coin />
    </>
  );
}
