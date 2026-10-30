// 차트 데이터 프리로드 — 차트 번들(ssr:false)이 내려와 hydrate 된 뒤(실측 ~1.9s)에야 /api/chartdata 를 부르던
// 직렬 대기를 없앤다: HTML 파싱 시점에 브라우저가 같은 URL 을 미리 받아 두고, 훅의 fetch() 는 그 응답을 재사용한다. (2026-10-30)
// cats 는 src/pages/*.jsx 의 ChartPage chartType 과 같아야 한다(URL 이 글자 단위로 같아야 프리로드가 맞는다).
import React from "react";
import Head from "next/head";

export default function ChartPreload({ cats }) {
  return (
    <Head>
      {cats.map((c) => (
        <link key={c} rel="preload" as="fetch" crossOrigin="anonymous" href={`/api/chartdata?cat=${encodeURIComponent(c)}`} />
      ))}
    </Head>
  );
}
