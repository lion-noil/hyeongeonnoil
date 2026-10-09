// 동적 OG 이미지(/api/og/*) 공용 — 폰트 로드·브랜드 상수·숫자 포맷·기본 이미지 폴백. edge 런타임에서 import 된다. (2026-10-09)
// 왜: 브리핑·시세 페이지에 이미지가 없어 구글 디스커버 대상이 안 되고 링크 카드가 글자뿐이었다.
// 폰트: Noto Sans KR 을 KS X 1001 한글 2,350자 + 라틴·기호로 서브셋한 woff(public/fonts, 각 ~215KB).
//   edge 번들에 넣지 않고 요청 origin 의 /fonts/* 에서 fetch 해 모듈 스코프에 캐시한다(번들 크기 제한 회피, 콜드스타트 1회 비용).
// 폴백: day/slug 가 없거나 데이터가 없으면 public/og-default.png 를 그대로 흘려보낸다(리다이렉트는 일부 크롤러가 안 따라옴).

export const OG_W = 1200;
export const OG_H = 630;
export const CACHE_HEADER = "public, max-age=3600, s-maxage=86400";
export const SITE = "https://hyeongeonnoil.com";

export const C = {
  bg: "#04060f",
  panel: "rgba(255,255,255,0.05)",
  line: "rgba(255,255,255,0.10)",
  sky: "#00bfff",
  mint: "#00ffcc",
  text: "#f0f4ff",
  sub: "#c3cada",
  dim: "#8a94a8",
  up: "#ff6b6b",
  down: "#4dabf7",
  flat: "#aab2c2",
};

export function originOf(req) {
  try {
    return new URL(req.url).origin;
  } catch {
    return SITE;
  }
}

let fontCache = null; // Promise<[{name,data,weight,style}]> — 같은 isolate 안에서 재사용
export function loadFonts(origin) {
  if (fontCache) return fontCache;
  fontCache = (async () => {
    const get = async (file) => {
      const res = await fetch(`${origin}/fonts/${file}`);
      if (!res.ok) throw new Error(`font ${file} ${res.status}`);
      return res.arrayBuffer();
    };
    const [regular, bold] = await Promise.all([get("NotoSansKR-Regular.woff"), get("NotoSansKR-Bold.woff")]);
    return [
      { name: "Noto Sans KR", data: regular, weight: 400, style: "normal" },
      { name: "Noto Sans KR", data: bold, weight: 700, style: "normal" },
    ];
  })();
  fontCache.catch(() => {
    fontCache = null; // 실패는 캐시하지 않음
  });
  return fontCache;
}

// 기본 이미지 폴백 — public/og-default.png 를 프록시. 그것마저 실패하면 리다이렉트.
// ImageResponse 는 본문을 스트림으로 늦게 그려서 렌더 오류가 try/catch 밖(파이프 단계)에서 터진다.
// 여기서 끝까지 그려 버퍼로 돌려주면 호출부의 catch 가 폴백으로 이어진다.
export async function toPngResponse(imageResponse) {
  const buf = await imageResponse.arrayBuffer();
  return new Response(buf, { status: 200, headers: { "content-type": "image/png", "cache-control": CACHE_HEADER } });
}

export async function fallbackResponse(origin, status = 200) {
  try {
    const res = await fetch(`${origin}/og-default.png`);
    if (res.ok) {
      return new Response(await res.arrayBuffer(), {
        status,
        headers: { "content-type": "image/png", "cache-control": CACHE_HEADER, "x-og-fallback": "1" },
      });
    }
  } catch {
    /* ignore */
  }
  return Response.redirect(`${SITE}/og-default.png`, 302);
}

export function fmtNum(v, dec = 2, locale = "en-US") {
  if (v == null || !Number.isFinite(Number(v))) return "-";
  return Number(v).toLocaleString(locale, { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
export function signed(v, dec = 2) {
  if (v == null || !Number.isFinite(Number(v))) return "-";
  const n = Number(v);
  return (n > 0 ? "+" : n < 0 ? "−" : "") + fmtNum(Math.abs(n), dec);
}
export function colorOf(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n === 0) return C.flat;
  return n > 0 ? C.up : C.down;
}
export function arrowOf(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n === 0) return "";
  return n > 0 ? "▲" : "▼";
}

const MONTH_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function fmtDate(day, lang) {
  const [y, m, d] = String(day || "").split("-").map(Number);
  if (!y || !m || !d) return String(day || "");
  return lang === "en" ? `${MONTH_EN[m - 1]} ${d}, ${y}` : `${y}년 ${m}월 ${d}일`;
}

// 공통 프레임 — 배경·격자 느낌의 글로우·상단 브랜드 줄·하단 URL 줄. children 은 가운데 영역.
export function Frame({ kicker, right, footerLeft, footerRight, children }) {
  return (
    <div
      style={{
        width: OG_W,
        height: OG_H,
        display: "flex",
        flexDirection: "column",
        padding: "48px 60px 40px",
        backgroundColor: C.bg,
        backgroundImage: "radial-gradient(circle at 92% 0%, rgba(0,120,190,0.42) 0%, rgba(4,6,15,0) 48%), radial-gradient(circle at 0% 100%, rgba(0,140,120,0.35) 0%, rgba(4,6,15,0) 45%)",
        color: C.text,
        fontFamily: '"Noto Sans KR"',
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 26 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: C.mint, marginRight: 14 }} />
          <span style={{ color: C.mint, fontWeight: 700 }}>{kicker}</span>
        </div>
        <span style={{ color: C.dim }}>{right}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between", marginTop: 20 }}>{children}</div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `2px solid ${C.line}`,
          paddingTop: 18,
          marginTop: 22,
          fontSize: 24,
        }}
      >
        <span style={{ color: C.sky, fontWeight: 700 }}>{footerLeft || "hyeongeonnoil.com"}</span>
        <span style={{ color: C.dim }}>{footerRight}</span>
      </div>
    </div>
  );
}
