// api/reports.ts — 트레이딩봇 보고서(월간/심층/주간) 조회. 앱(NewsInsight)·사이트 공용.
//   GET /api/reports          → { retCode: 0, reports: [meta...] }   (md 제외, 최신순)
//   GET /api/reports?id=monthly:2026-08  → { retCode: 0, report: {..., md} }
// 원천: Upstash 해시 trading:reports (News_scrap/app/report_store.py 발행)
export const config = { runtime: "edge" };
import { getReport, listReports, slugToId, idToSlug } from "../../src/lib/reportsDb";

function json(payload: unknown, status = 200, maxAge = 300): Response {
  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 4}`,
    },
    status,
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return json({ retCode: -1, retMsg: "Env missing UPSTASH_REDIS_REST_URL/TOKEN" }, 500, 0);
  }
  try {
    const { searchParams } = new URL(req.url);
    const idParam = (searchParams.get("id") || "").trim();
    if (idParam) {
      // id(monthly:2026-08) 또는 슬러그(monthly-2026-08) 둘 다 허용
      const id = idToSlug(idParam) ? idParam : slugToId(idParam);
      if (!id) return json({ retCode: -1, retMsg: "invalid id" }, 400, 0);
      const report = await getReport(id);
      if (!report) return json({ retCode: -1, retMsg: "not_found" }, 404, 60);
      return json({ retCode: 0, report });
    }
    const reports = await listReports();
    return json({ retCode: 0, reports });
  } catch (e: any) {
    return json({ retCode: -1, retMsg: e?.message || "server error" }, 500, 0);
  }
}
