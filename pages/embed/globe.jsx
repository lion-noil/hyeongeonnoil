// 앱(NewsInsight 안드로이드) 홈 상단 웹뷰용 — 3D 지구본만, 투명 배경. 검색 제외. (2026-09-28)
//   앱: WebView(투명) → https://hyeongeonnoil.com/embed/globe
import Head from "next/head";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useGlobeData } from "../../src/components/three/globeData";

const HeroGlobe = dynamic(() => import("../../src/components/three/HeroGlobe"), { ssr: false });

export default function EmbedGlobe() {
  const { countries, relations } = useGlobeData();
  const [h, setH] = useState(360);
  useEffect(() => {
    const fit = () => setH(window.innerHeight);
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return (
    <>
      <Head>
        <title>NewsInsight Globe</title>
        <meta name="robots" content="noindex, nofollow" />
        <style>{`html,body{background:transparent!important;margin:0;overflow:hidden;touch-action:none}`}</style>
      </Head>
      <HeroGlobe countries={countries} relations={relations} height={h} />
    </>
  );
}
