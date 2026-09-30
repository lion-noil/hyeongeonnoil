// 서버 전용 — 차트 페이지 서버렌더 요약(최근 종가 목록)용 조회. (2026-09-30)
// pages/api/chartdata.ts 와 같은 원천(Upstash 해시 chart_data[{cat}], 생산자 News_scrap fetch_and_store_chart_data)을
// getStaticProps 에서 직접 읽어, JS 없이 보는 크롤러에게도 종목·종가·날짜·MA100 대비 % 를 텍스트로 준다.
// 행 형식: { close, date, ma100, ... } 의 배열(날짜 오름차순). 마지막 유효 close 만 쓴다.
import { Redis } from "@upstash/redis";
import { chartParams } from "../constants/chartMeta";

function client() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function parseMaybeJson(v) {
  if (v == null || typeof v !== "string") return v;
  const s = v.trim();
  if (!s.startsWith("{") && !s.startsWith("[")) return v;
  try {
    return JSON.parse(s);
  } catch {
    return v;
  }
}

// 카테고리 목록(currency/treasury/index/commodity) → chartMeta 순서대로 [{key,label,close,date,vsMa100}]
// 데이터 없는 키(예: 상수와 저장 키 철자가 다른 경우)는 조용히 건너뜀. 오류 시 [] (페이지는 설명만 렌더).
export async function getLatestCloses(cats) {
  const r = client();
  if (!r) return [];
  const list = Array.isArray(cats) ? cats : [cats];
  const raws = await Promise.all(list.map((cat) => r.hget("chart_data", cat)));
  const out = [];
  list.forEach((cat, i) => {
    const parsed = parseMaybeJson(raws[i]);
    if (!parsed || typeof parsed !== "object") return;
    for (const { key, label } of chartParams[cat] || []) {
      const rows = parsed[key]?.data;
      if (!Array.isArray(rows) || !rows.length) continue;
      let last = null;
      for (let j = rows.length - 1; j >= 0; j--) {
        if (Number.isFinite(Number(rows[j]?.close))) {
          last = rows[j];
          break;
        }
      }
      if (!last) continue;
      const close = Number(last.close);
      const ma = Number(last.ma100);
      out.push({
        key,
        label,
        close,
        date: String(last.date || "").slice(0, 10),
        vsMa100: Number.isFinite(ma) && ma !== 0 ? Math.round((close / ma - 1) * 1000) / 10 : null,
      });
    }
  });
  return out;
}
