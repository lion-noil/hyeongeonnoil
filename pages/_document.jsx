import NextDocument, { Html, Head, Main, NextScript } from "next/document";

// /en/* 라우트는 <html lang="en"> — 영문 시세·브리핑 페이지(2026-10-09). 그 외는 ko.
export default function Document({ lang = "ko" }) {
  return (
    <Html lang={lang}>
      <Head>
        <meta name="theme-color" content="#04060f" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo192.png" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

Document.getInitialProps = async (ctx) => {
  const initial = await NextDocument.getInitialProps(ctx);
  const p = String(ctx.pathname || "");
  return { ...initial, lang: p === "/en" || p.startsWith("/en/") ? "en" : "ko" };
};
