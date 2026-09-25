// 동적 사이트맵 — 정적 라우트 + 아카이브 전 날짜 (구 public/sitemap.xml 대체)
import { listAllDays } from "../src/lib/archiveDb";
import { listBriefingDays } from "../src/lib/briefingDb";

const SITE = "https://hyeongeonnoil.com";
const STATIC_PATHS = ["", "/briefing", "/exchange", "/indexes", "/commodity", "/coin", "/cfd", "/archive", "/reports", "/updates", "/others", "/privacy"];

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

  const urls = [
    ...STATIC_PATHS.map((p) => `  <url><loc>${SITE}${p}</loc></url>`),
    ...briefingDays.map((d) => `  <url><loc>${SITE}/briefing/${d}</loc><lastmod>${d}</lastmod></url>`),
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
