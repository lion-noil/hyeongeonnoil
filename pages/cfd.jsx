import dynamic from "next/dynamic";
import Seo from "../src/components/Seo";
import SeoSummary from "../src/components/SeoSummary";
const Cfd = dynamic(() => import("../src/pages/Cfd"), { ssr: false });

export default function CfdPage() {
  return (
    <>
      <Seo
        title="CFD·FX 차트와 자동매매 시그널 | NewsInsight"
        description="MT5 기반 지수·귀금속·외환(FX) CFD 시세 차트와 자동매매 전략 시그널, 계좌 현황을 보는 대시보드입니다."
        path="/cfd"
      />
      {/* 서버렌더 요약 — 본문은 ssr:false(실시간 WS 차트)라 설명만 제공 */}
      <SeoSummary
        title="CFD·FX 차트와 MT5 자동매매 시그널"
        paragraphs={[
          "MT5(HFM) 기반 지수(US100·US500 등)·귀금속(금·은)·원유·외환(USDJPY 등) CFD의 1분·4시간·일봉 차트를 실시간으로 보여주고, 심볼별 진입 전략과 신호를 표시합니다.",
          "운영자 개인 MT5 계좌의 자동매매 포지션·평가액·손익과 매매 전적 통계를 공개합니다. 과거 성과가 미래를 보장하지 않으며 투자 권유가 아닙니다.",
        ]}
      />
      <Cfd />
    </>
  );
}
