import dynamic from "next/dynamic";
import Link from "next/link";
import Seo from "../src/components/Seo";
import { HubIntro, HubGuide } from "../src/components/HubSummary";
import { HUBS } from "../src/lib/hubContent";
import { hubStaticProps } from "../src/lib/hubDb";
const Cfd = dynamic(() => import("../src/pages/Cfd"), { ssr: false });
// 환율 전용 MT5 계좌 페이지 (2026-10-05~) — CFD 페이지와 같은 화면을 환율 7종·환율 계좌로 연다
export default function FxPage({ hub }) {
  const H = HUBS.fx;
  return (
    <>
      <Seo title={H.seo.title} description={H.seo.description} path={H.path} />
      {/* 서버렌더 본문(2026-10-18) — 차트는 ssr:false 라 크롤러용 텍스트(h1·최근 종가·읽는 법·FAQ)를 위아래로 제공 */}
      <HubIntro hubKey="fx" hub={hub} />
      {/* 제3자 검증 기록 링크(2026-10-19): FX Blue·Myfxbook·QuantConnect */}
      <p style={{ maxWidth: 860, margin: "0 auto 8px", padding: "0 16px", color: "#999", fontSize: 13 }}>
        이 계좌의 기록을 외부 서버가 집계·검증한 결과는 <Link href="/verified" style={{ color: "#00ffcc" }}>검증 기록</Link>에서 볼 수 있습니다.
      </p>
      <Cfd variant="fx" />
      <HubGuide hubKey="fx" hub={hub} />
    </>
  );
}

// 숫자는 chart_data 일봉·최신 브리핑에서 10분 ISR(src/lib/hubDb.js). 오류 시 설명·링크·FAQ 만 렌더.
export async function getStaticProps() {
  return hubStaticProps("fx");
}
