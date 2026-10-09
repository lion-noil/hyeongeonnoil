// OG/트위터 이미지 메타 한 벌 — _app 이 기본(og-default.png)을 깔고, 브리핑·시세 페이지가 같은 key 로 덮어쓴다. (2026-10-09)
// key 를 양쪽에서 똑같이 써야 next/head 가 중복 없이 교체한다(name 메타는 key 가 있으면 name 중복제거를 건너뜀).
// 절대 URL 필수(카카오·트위터·구글 디스커버 전부 상대경로 미지원). 1200×630.
import Head from "next/head";

export const OG_DEFAULT_IMAGE = "https://hyeongeonnoil.com/og-default.png";

export default function OgImageMeta({ url = OG_DEFAULT_IMAGE, alt = "현건노일 NewsInsight" }) {
  return (
    <Head>
      <meta property="og:image" content={url} key="og-image" />
      <meta property="og:image:width" content="1200" key="og-image-w" />
      <meta property="og:image:height" content="630" key="og-image-h" />
      <meta property="og:image:alt" content={alt} key="og-image-alt" />
      <meta name="twitter:card" content="summary_large_image" key="tw-card" />
      <meta name="twitter:image" content={url} key="tw-image" />
    </Head>
  );
}
