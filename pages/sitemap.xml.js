// 동적 사이트맵 — 정적 라우트 + 아카이브 전 날짜 (구 public/sitemap.xml 대체)
import { listAllDays } from "../src/lib/archiveDb";
import { listBriefingDays, listBriefingsEn } from "../src/lib/briefingDb";
import { getMarketOverview, todayKST } from "../src/lib/marketDataDb";

const SITE = "https://hyeongeonnoil.com";
const STATIC_PATHS = ["", "/en", "/briefing", "/market", "/en/market", "/en/briefing", "/en/archive", "/exchange", "/indexes", "/commodity", "/coin", "/cfd", "/fx", "/archive", "/reports", "/updates", "/others", "/privacy"];

export async function getServerSideProps({ res }) {
  let days = [];
  let briefingDays = [];
  try {
    days = await listAllDays();
  } catch {
    // DB 오류 시에도 정적 경로는 내보냄
  }
  try {
    briefingDays = await listBriefingDays();
  } catch {
    // Redis 오류 시 브리핑 항목만 생략
  }
  // 영문 브리핑(en 블록 있는 날만)·시세 키워드 페이지(데이터 있는 심볼만, lastmod=오늘) (2026-10-09)
  let enBriefingDays = [];
  let marketSlugs = [];
  try {
    enBriefingDays = (await listBriefingsEn(1000)).map((b) => b.day);
  } catch {
    // 생략
  }
  try {
    marketSlugs = (await getMarketOverview()).map((o) => o.slug);
  } catch {
    // 생략
  }
  const today = todayKST();

  const urls = [
    ...STATIC_PATHS.map((p) => `  <url><loc>${SITE}${p}</loc></url>`),
    ...marketSlugs.map((slug) => `  <url><loc>${SITE}/market/${slug}</loc><lastmod>${today}</lastmod></url>`),
    ...marketSlugs.map((slug) => `  <url><loc>${SITE}/en/market/${slug}</loc><lastmod>${today}</lastmod></url>`),
    ...briefingDays.map((d) => `  <url><loc>${SITE}/briefing/${d}</loc><lastmod>${d}</lastmod></url>`),
    ...enBriefingDays.map((d) => `  <url><loc>${SITE}/en/briefing/${d}</loc><lastmod>${d}</lastmod></url>`),
    ...days.map((d) => `  <url><loc>${SITE}/archive/${d}</loc><lastmod>${d}</lastmod></url>`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.write(xml);
  res.end();
  return { props: {} };
}

export default function SiteMap() {
  return null;
}
