// 오늘의 시장 브리핑 — 어제 종가 시세 + 세계 뉴스 연결, 매일 아침 1편 (2026-09-25)
// 원천: Upstash market_briefings (News_scrap/app/시장브리핑.py). ISR: 요청 시 생성·30분 캐시.
// 왜 이 페이지인가: 아카이브(날짜별 뉴스 요약)는 검색 수요가 없고, '달러 환율 전망'·'미국 금리'·'코스피 전망'은 월 수만 건.
//   제목에 숫자와 방향이 들어간 검색형 문장 + 시세표(원 데이터) + 뉴스 연결이 이 사이트만 만들 수 있는 조합.
import Head from "next/head";
import Link from "next/link";
import { getBriefing, listBriefingDays } from "../../src/lib/briefingDb";

const SITE = "https://hyeongeonnoil.com";
const box = { maxWidth: 780, margin: "0 auto", padding: "8px 16px 40px", color: "#eee" };
const card = { background: "#242424", borderRadius: 10, padding: "16px 18px", marginBottom: 16 };
const UP = "#ff6b6b";
const DOWN = "#4dabf7";

function fmt(v, dec) {
  if (v == null || Number.isNaN(Number(v))) return "-";
  return Number(v).toLocaleString("ko-KR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function signed(v, dec) {
  if (v == null) return "-";
  const n = Number(v);
  return (n > 0 ? "+" : "") + fmt(n, dec);
}
function color(v) {
  const n = Number(v);
  return n > 0 ? UP : n < 0 ? DOWN : "#bbb";
}
function kdate(day) {
  const [y, m, d] = day.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

export default function BriefingDayPage({ b, prevDay, nextDay }) {
  const url = `${SITE}/briefing/${b.day}`;
  const pageTitle = `${b.title} | NewsInsight`;
  const desc = String(b.lead || "").replace(/\s+/g, " ").slice(0, 155);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsArticle",
        headline: b.title,
        description: desc,
        datePublished: `${b.day}T07:00:00+09:00`,
        dateModified: b.generated_at || `${b.day}T07:00:00+09:00`,
        inLanguage: "ko",
        articleSection: "시장 브리핑",
        keywords: (b.keywords || []).join(", "),
        author: { "@type": "Organization", name: "NewsInsight" },
        publisher: { "@type": "Organization", name: "NewsInsight", url: SITE },
        mainEntityOfPage: url,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "시장 브리핑", item: `${SITE}/briefing` },
          { "@type": "ListItem", position: 2, name: kdate(b.day), item: url },
        ],
      },
    ],
  };

  return (
    <div style={box}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={desc} key="desc" />
        <meta property="og:title" content={b.title} key="og-title" />
        <meta property="og:description" content={desc} key="og-desc" />
        <meta property="og:url" content={url} key="og-url" />
        <meta property="og:type" content="article" key="og-type" />
        <link rel="canonical" href={url} key="canonical" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <p style={{ color: "#999", fontSize: 13, margin: "8px 0 4px" }}>
        <Link href="/briefing" style={{ color: "#00ffcc" }}>시장 브리핑</Link> · {kdate(b.day)} 아침 발행 · 시세 기준 {b.data_date} 종가
      </p>
      <h1 style={{ color: "#00bfff", fontSize: 24, lineHeight: 1.35, marginTop: 4 }}>{b.title}</h1>
      <p style={{ fontSize: 16, lineHeight: 1.8, color: "#ddd" }}>{b.lead}</p>

      {/* 시세표 — 모델이 쓴 숫자의 원 데이터. 항상 함께 보인다. */}
      <section style={card}>
        <h2 style={{ color: "#00ffcc", fontSize: 17, marginTop: 0 }}>어제 종가</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ color: "#999", textAlign: "right" }}>
                <th style={{ textAlign: "left", padding: "6px 4px" }}>지표</th>
                <th style={{ padding: "6px 4px" }}>종가</th>
                <th style={{ padding: "6px 4px" }}>전일비</th>
                <th style={{ padding: "6px 4px" }}>등락률</th>
              </tr>
            </thead>
            <tbody>
              {(b.snapshot || []).map((s) => {
                const isRate = s.unit === "%";
                return (
                  <tr key={s.key} style={{ borderTop: "1px solid #333", textAlign: "right" }}>
                    <td style={{ textAlign: "left", padding: "7px 4px", color: "#ddd" }}>
                      {s.label}
                      <span style={{ color: "#777", fontSize: 11, marginLeft: 6 }}>{s.date?.slice(5)}</span>
                    </td>
                    <td style={{ padding: "7px 4px" }}>{isRate ? `${fmt(s.close, 3)}%` : `${fmt(s.close, s.dec)}${s.unit || ""}`}</td>
                    <td style={{ padding: "7px 4px", color: color(s.chg) }}>{isRate ? `${signed(s.chg_bp, 1)}bp` : signed(s.chg, s.dec)}</td>
                    <td style={{ padding: "7px 4px", color: color(s.pct) }}>{isRate ? "-" : `${signed(s.pct, 2)}%`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p style={{ color: "#777", fontSize: 12, margin: "10px 0 0" }}>
          지표 옆 날짜는 해당 종가의 거래일. 비트코인은 발행 시각(오전 7시) 현재가. 금리 전일비는 bp(0.01%p).
        </p>
      </section>

      {(b.sections || []).map((s) =>
        s.body ? (
          <section key={s.key} style={card}>
            <h2 style={{ color: "#00ffcc", fontSize: 18, marginTop: 0 }}>{s.heading}</h2>
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.85, fontSize: 15 }}>{s.body}</div>
          </section>
        ) : null,
      )}

      {b.news_items?.length > 0 && (
        <section style={card}>
          <h2 style={{ color: "#00ffcc", fontSize: 17, marginTop: 0 }}>어제의 세계 핵심 뉴스</h2>
          <ol style={{ margin: "0 0 8px", paddingLeft: 20, lineHeight: 1.8, fontSize: 14 }}>
            {b.news_items.map((n, i) => (
              <li key={i}>
                {n.category ? <span style={{ color: "#999" }}>[{n.category}] </span> : null}
                {n.title}
              </li>
            ))}
          </ol>
          {b.news_day && (
            <Link href={`/archive/${b.news_day}`} style={{ color: "#00bfff", fontSize: 13 }}>
              {kdate(b.news_day)} 각국 뉴스 요약 전문 →
            </Link>
          )}
        </section>
      )}

      {b.keywords?.length > 0 && (
        <p style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "4px 0 16px" }}>
          {b.keywords.map((k) => (
            <span key={k} style={{ fontSize: 12, color: "#9bd", border: "1px solid #333", borderRadius: 6, padding: "3px 8px" }}>
              {k}
            </span>
          ))}
        </p>
      )}

      <p style={{ color: "#777", fontSize: 12, lineHeight: 1.7 }}>
        이 글은 공개 시세 데이터와 각국 뉴스 방송 요약을 자동으로 정리한 정보이며 투자 권유가 아닙니다. 수치는 표의 원 데이터 기준이고,
        시장 상황은 발행 이후 달라질 수 있습니다.
      </p>

      <nav style={{ display: "flex", justifyContent: "space-between", marginTop: 24, fontSize: 14 }}>
        <span>{prevDay && <Link href={`/briefing/${prevDay}`} style={{ color: "#00ffcc" }}>← {prevDay}</Link>}</span>
        <span>{nextDay && <Link href={`/briefing/${nextDay}`} style={{ color: "#00ffcc" }}>{nextDay} →</Link>}</span>
      </nav>
    </div>
  );
}

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const day = String(params.day || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { notFound: true };
  try {
    const [b, days] = await Promise.all([getBriefing(day), listBriefingDays()]);
    if (!b || !b.title) return { notFound: true, revalidate: 300 }; // 아침 생성 전 요청 → 5분 뒤 재시도
    const idx = days.indexOf(day); // 최신순
    return {
      props: {
        b,
        prevDay: idx >= 0 && idx + 1 < days.length ? days[idx + 1] : null,
        nextDay: idx > 0 ? days[idx - 1] : null,
      },
      revalidate: 1800,
    };
  } catch {
    return { notFound: true, revalidate: 60 };
  }
}
