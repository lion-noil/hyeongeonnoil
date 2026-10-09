// 키워드 상시 페이지(/market/[slug]·/en/market/[slug]) 정의 — slug → chart_data 심볼 + 한/영 메타. (2026-10-09)
// 왜: 검색 수요가 큰 '달러 환율 전망'·'미국 금리'·'금 시세' 같은 키워드에는 본문 있는 페이지가 없었다(/exchange 등은 차트만).
//   이 표 하나로 ko/en 페이지·목록·홈 링크·사이트맵·llms.txt 가 같은 집합을 쓴다.
// 필드:
//   cat/key   chart_data 해시의 카테고리·심볼. computed 는 교차 계산(jpy-krw = usd_krw / usd_jpy × 100)
//   kind      "rate"(금리, 전일비 bp) | "price"
//   dec       표시 소수 자리
//   section   최신 브리핑에서 '관련 뉴스'로 보여줄 section key
//   snap      브리핑 snapshot 의 key (영문 시세표 라벨 매핑에도 사용)
//   ko/en     { name: H1·카드용 표시명, seo: title 앞머리(검색어), unit, desc: 1줄 설명, keywords[] }

export const MARKET_TOPICS = [
  {
    slug: "usd-krw", cat: "currency", key: "usd_krw", kind: "price", dec: 1, section: "fx_rates", snap: "usd_krw",
    ko: { name: "달러/원 환율", seo: "달러 환율 전망", unit: "원", desc: "오늘 달러/원 환율 종가와 전일·1주·1개월 변화, 100일 이동평균 대비 위치", keywords: ["달러환율전망", "오늘환율", "달러환율", "원달러 환율"] },
    en: { name: "USD/KRW Exchange Rate", seo: "USD/KRW Exchange Rate", unit: "KRW", desc: "US dollar to Korean won daily close, day/week/month change and position vs the 100-day average", keywords: ["USD KRW", "dollar won exchange rate", "Korean won forecast"] },
  },
  {
    slug: "jpy-krw", cat: "currency", key: "jpy_krw", computed: "jpy_krw", kind: "price", dec: 2, section: "fx_rates", snap: null,
    ko: { name: "엔/원 환율(100엔당)", seo: "엔화 환율 전망", unit: "원", desc: "100엔당 원화 환율 — 달러/원·달러/엔 종가로 계산한 교차환율", keywords: ["엔화환율전망", "엔화환율", "엔저", "100엔 환율"] },
    en: { name: "JPY/KRW (per 100 yen)", seo: "JPY/KRW Exchange Rate", unit: "KRW", desc: "Korean won per 100 Japanese yen, a cross rate computed from USD/KRW and USD/JPY closes", keywords: ["JPY KRW", "yen won exchange rate"] },
  },
  {
    slug: "usd-jpy", cat: "currency", key: "usd_jpy", kind: "price", dec: 2, section: "fx_rates", snap: "usd_jpy",
    ko: { name: "달러/엔 환율", seo: "달러/엔 환율 전망", unit: "엔", desc: "달러/엔 환율 종가와 최근 추이", keywords: ["달러엔환율", "엔달러", "USDJPY"] },
    en: { name: "USD/JPY Exchange Rate", seo: "USD/JPY Exchange Rate", unit: "JPY", desc: "US dollar to Japanese yen daily close and recent trend", keywords: ["USD JPY", "dollar yen"] },
  },
  {
    slug: "dxy", cat: "currency", key: "dxy", kind: "price", dec: 2, section: "fx_rates", snap: "dxy",
    ko: { name: "달러인덱스(DXY)", seo: "달러인덱스 전망", unit: "", desc: "달러인덱스 종가와 최근 추이", keywords: ["달러인덱스", "DXY", "달러 강세"] },
    en: { name: "US Dollar Index (DXY)", seo: "US Dollar Index (DXY)", unit: "", desc: "US Dollar Index daily close and recent trend", keywords: ["DXY", "dollar index"] },
  },
  {
    slug: "us-10y", cat: "treasury", key: "us-t10", kind: "rate", dec: 3, section: "fx_rates", snap: "us-t10",
    ko: { name: "미국 10년물 국채 금리", seo: "미국 금리 전망", unit: "%", desc: "미국 10년물 국채 금리 — 미국 금리 추이와 전일·1주·1개월 변화", keywords: ["미국 금리", "미국 10년물 국채 금리", "미국 국채금리", "미국 금리 전망"] },
    en: { name: "US 10-Year Treasury Yield", seo: "US 10-Year Treasury Yield", unit: "%", desc: "US 10-year Treasury yield daily close and recent trend", keywords: ["US 10 year treasury yield", "US interest rates"] },
  },
  {
    slug: "kr-3y", cat: "treasury", key: "kr-t3", kind: "rate", dec: 3, section: "fx_rates", snap: "kr-t3",
    ko: { name: "한국 국고채 3년물 금리", seo: "국고채 3년물 금리", unit: "%", desc: "한국 국고채 3년물 금리 종가와 최근 추이", keywords: ["국고채 3년 금리", "한국 금리", "국채금리"] },
    en: { name: "Korea 3-Year Government Bond Yield", seo: "Korea 3-Year Bond Yield", unit: "%", desc: "Korean 3-year government bond yield daily close and recent trend", keywords: ["Korea 3 year bond yield", "Korean interest rates"] },
  },
  {
    slug: "kospi200", cat: "index", key: "kospi200", kind: "price", dec: 2, section: "equities", snap: "kospi200",
    ko: { name: "코스피200", seo: "코스피 전망", unit: "", desc: "코스피200 지수 종가와 전일·1주·1개월 변화 — 코스피 전망의 근거 수치", keywords: ["코스피전망", "코스피200", "코스피 지수"] },
    en: { name: "KOSPI 200", seo: "KOSPI 200 Index", unit: "", desc: "KOSPI 200 index daily close and recent trend", keywords: ["KOSPI 200", "Korea stock index"] },
  },
  {
    slug: "nasdaq100", cat: "index", key: "nasdaq100", kind: "price", dec: 2, section: "equities", snap: "nasdaq100",
    ko: { name: "나스닥100", seo: "나스닥100 전망", unit: "", desc: "나스닥100 지수 종가와 최근 추이", keywords: ["나스닥100", "나스닥 전망", "나스닥 지수"] },
    en: { name: "Nasdaq 100", seo: "Nasdaq 100 Index", unit: "", desc: "Nasdaq 100 index daily close and recent trend", keywords: ["Nasdaq 100", "NDX"] },
  },
  {
    slug: "nikkei225", cat: "index", key: "nikkei225", kind: "price", dec: 2, section: "equities", snap: "nikkei225",
    ko: { name: "닛케이225", seo: "닛케이225 전망", unit: "", desc: "일본 닛케이225 지수 종가와 최근 추이", keywords: ["닛케이", "닛케이225", "일본 증시"] },
    en: { name: "Nikkei 225", seo: "Nikkei 225 Index", unit: "", desc: "Nikkei 225 index daily close and recent trend", keywords: ["Nikkei 225", "Japan stock index"] },
  },
  {
    slug: "hangseng", cat: "index", key: "hangseng", kind: "price", dec: 2, section: "equities", snap: "hangseng",
    ko: { name: "항셍지수", seo: "항셍지수 전망", unit: "", desc: "홍콩 항셍지수 종가와 최근 추이", keywords: ["항셍지수", "홍콩 증시", "항셍"] },
    en: { name: "Hang Seng Index", seo: "Hang Seng Index", unit: "", desc: "Hang Seng index daily close and recent trend", keywords: ["Hang Seng", "Hong Kong stock index"] },
  },
  {
    slug: "dax", cat: "index", key: "dax", kind: "price", dec: 2, section: "equities", snap: "dax",
    ko: { name: "독일 DAX", seo: "독일 DAX 전망", unit: "", desc: "독일 DAX 지수 종가와 최근 추이", keywords: ["DAX", "독일 증시", "닥스 지수"] },
    en: { name: "DAX", seo: "DAX Index", unit: "", desc: "German DAX index daily close and recent trend", keywords: ["DAX", "Germany stock index"] },
  },
  {
    slug: "gold", cat: "commodity", key: "gold", kind: "price", dec: 2, section: "commodities_crypto", snap: "gold",
    ko: { name: "국제 금 시세", seo: "금 시세", unit: "달러/온스", desc: "국제 금값(달러/온스) 종가와 전일·1주·1개월 변화 — 국제 금값 추이", keywords: ["금시세", "국제 금값", "금값 전망", "금 시세 추이"] },
    en: { name: "Gold Price", seo: "Gold Price", unit: "USD/oz", desc: "Gold futures daily close (USD per troy ounce) and recent trend", keywords: ["gold price", "gold price today", "gold futures"] },
  },
  {
    slug: "crude-oil", cat: "commodity", key: "crude_oil", kind: "price", dec: 2, section: "commodities_crypto", snap: "crude_oil",
    ko: { name: "WTI 국제유가", seo: "국제유가 WTI 전망", unit: "달러/배럴", desc: "WTI 원유 선물 종가와 최근 추이", keywords: ["국제유가", "WTI", "원유 가격", "유가 전망"] },
    en: { name: "WTI Crude Oil Price", seo: "WTI Crude Oil Price", unit: "USD/bbl", desc: "WTI crude oil futures daily close and recent trend", keywords: ["WTI crude", "oil price", "crude oil price today"] },
  },
  {
    slug: "natural-gas", cat: "commodity", key: "natural_gas", kind: "price", dec: 3, section: "commodities_crypto", snap: null,
    ko: { name: "천연가스 선물", seo: "천연가스 시세", unit: "달러/MMBtu", desc: "미국 천연가스 선물 종가와 최근 추이", keywords: ["천연가스 시세", "천연가스 가격", "천연가스 선물"] },
    en: { name: "Natural Gas Price", seo: "Natural Gas Price", unit: "USD/MMBtu", desc: "Henry Hub natural gas futures daily close and recent trend", keywords: ["natural gas price", "Henry Hub"] },
  },
];

export const TOPIC_BY_SLUG = Object.fromEntries(MARKET_TOPICS.map((t) => [t.slug, t]));
export const TOPIC_SLUGS = MARKET_TOPICS.map((t) => t.slug);

// 영문 브리핑 시세표 라벨 — snapshot.key → 영문
export const SNAPSHOT_LABEL_EN = {
  usd_krw: "USD/KRW",
  dxy: "Dollar Index",
  usd_jpy: "USD/JPY",
  "us-t10": "US 10Y Yield",
  "kr-t3": "Korea 3Y Yield",
  kospi200: "KOSPI 200",
  nasdaq100: "Nasdaq 100",
  nikkei225: "Nikkei 225",
  hangseng: "Hang Seng",
  dax: "DAX",
  crude_oil: "WTI Crude",
  gold: "Gold",
  btcusdt: "Bitcoin",
};

// snapshot.key → market slug (브리핑 시세표에서 시세 페이지로 연결)
export const SLUG_BY_SNAP = Object.fromEntries(MARKET_TOPICS.filter((t) => t.snap).map((t) => [t.snap, t.slug]));
