// Daily market briefing (English) — renders only when the briefing JSON carries an `en` block
// ({title, lead, sections[{key,heading,body}], keywords}) written by News_scrap. Otherwise 404, retry in 30 min. (2026-10-09)
// Price table uses the same snapshot numbers as the Korean page; labels are mapped to English.
import Head from "next/head";
import Link from "next/link";
import { getBriefing, listBriefingsEn } from "../../../src/lib/briefingDb";
import { SNAPSHOT_LABEL_EN, SLUG_BY_SNAP } from "../../../src/lib/marketTopics";
import { ldJson } from "../../../src/lib/jsonLd";
import OgImageMeta from "../../../src/components/OgImageMeta";

const SITE = "https://hyeongeonnoil.com";
const box = { maxWidth: 780, margin: "0 auto", padding: "8px 16px 40px", color: "#eee" };
const card = { background: "var(--panel-2)", borderRadius: 10, padding: "16px 18px", marginBottom: 16 };
const UP = "#ff6b6b";
const DOWN = "#4dabf7";
const MONTH_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmt(v, dec) {
  if (v == null || Number.isNaN(Number(v))) return "-";
  return Number(v).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
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
export function edate(day) {
  const [y, m, d] = String(day).split("-").map(Number);
  return `${MONTH_EN[m - 1]} ${d}, ${y}`;
}

export default function BriefingDayPageEn({ b, prevDay, nextDay }) {
  const en = b.en;
  const url = `${SITE}/en/briefing/${b.day}`;
  const pageTitle = `${en.title} | NewsInsight`;
  const desc = String(en.lead || "").replace(/\s+/g, " ").slice(0, 155);
  const ogImage = `${SITE}/api/og/briefing?day=${b.day}&lang=en`; // dynamic OG image (title + key prices) for Discover / link cards (2026-10-09)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsArticle",
        headline: en.title,
        description: desc,
        image: [ogImage],
        datePublished: `${b.day}T07:00:00+09:00`,
        dateModified: b.generated_at || `${b.day}T07:00:00+09:00`,
        inLanguage: "en",
        articleSection: "Market Briefing",
        keywords: (en.keywords || b.keywords || []).join(", "),
        author: { "@type": "Organization", name: "NewsInsight" },
        publisher: { "@type": "Organization", name: "NewsInsight", url: SITE },
        mainEntityOfPage: url,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Market Briefing", item: `${SITE}/en/briefing` },
          { "@type": "ListItem", position: 2, name: edate(b.day), item: url },
        ],
      },
    ],
  };

  return (
    <div style={box} lang="en">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={desc} key="desc" />
        <meta property="og:title" content={en.title} key="og-title" />
        <meta property="og:description" content={desc} key="og-desc" />
        <meta property="og:url" content={url} key="og-url" />
        <meta property="og:type" content="article" key="og-type" />
        <meta property="og:locale" content="en_US" key="og-locale" />
        <link rel="canonical" href={url} key="canonical" />
        <link rel="alternate" hrefLang="ko" href={`${SITE}/briefing/${b.day}`} key="alt-ko" />
        <link rel="alternate" hrefLang="en" href={url} key="alt-en" />
        <link rel="alternate" hrefLang="x-default" href={`${SITE}/briefing/${b.day}`} key="alt-x" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(jsonLd) }} />
      </Head>
      <OgImageMeta url={ogImage} alt={en.title} />

      <p style={{ color: "#999", fontSize: 13, margin: "8px 0 4px", display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <span>
          <Link href="/en" style={{ color: "#9bd" }}>EN Home</Link> › <Link href="/en/briefing" style={{ color: "#00ffcc" }}>Market Briefing</Link> · published {edate(b.day)} morning (KST) · prices as of {b.data_date} close
        </span>
        <Link href={`/briefing/${b.day}`} hrefLang="ko" style={{ color: "#9bd" }}>한국어</Link>
      </p>
      <h1 style={{ color: "#00bfff", fontSize: 24, lineHeight: 1.35, marginTop: 4 }}>{en.title}</h1>
      <p style={{ fontSize: 16, lineHeight: 1.8, color: "#ddd" }}>{en.lead}</p>

      <section style={card}>
        <h2 style={{ color: "#00ffcc", fontSize: 17, marginTop: 0 }}>Yesterday's closes</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ color: "#999", textAlign: "right" }}>
                <th style={{ textAlign: "left", padding: "6px 4px" }}>Indicator</th>
                <th style={{ padding: "6px 4px" }}>Close</th>
                <th style={{ padding: "6px 4px" }}>Change</th>
                <th style={{ padding: "6px 4px" }}>%</th>
              </tr>
            </thead>
            <tbody>
              {(b.snapshot || []).map((s) => {
                const isRate = s.unit === "%";
                const label = SNAPSHOT_LABEL_EN[s.key] || s.key;
                const slug = SLUG_BY_SNAP[s.key];
                return (
                  <tr key={s.key} style={{ borderTop: "1px solid var(--line)", textAlign: "right" }}>
                    <td style={{ textAlign: "left", padding: "7px 4px", color: "#ddd" }}>
                      {slug ? <Link href={`/en/market/${slug}`} style={{ color: "#ddd" }}>{label}</Link> : label}
                      <span style={{ color: "#777", fontSize: 11, marginLeft: 6 }}>{s.date?.slice(5)}</span>
                    </td>
                    <td style={{ padding: "7px 4px" }}>{isRate ? `${fmt(s.close, 3)}%` : fmt(s.close, s.dec)}</td>
                    <td style={{ padding: "7px 4px", color: color(s.chg) }}>{isRate ? `${signed(s.chg_bp, 1)}bp` : signed(s.chg, s.dec)}</td>
                    <td style={{ padding: "7px 4px", color: color(s.pct) }}>{isRate ? "-" : `${signed(s.pct, 2)}%`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p style={{ color: "#777", fontSize: 12, margin: "10px 0 0" }}>
          The date next to each indicator is the trading day of that close. Bitcoin is the spot price at publication (7am KST). Yield changes are in bp (0.01 pp).
        </p>
      </section>

      {(en.sections || []).map((s) =>
        s.body ? (
          <section key={s.key} style={card}>
            <h2 style={{ color: "#00ffcc", fontSize: 18, marginTop: 0 }}>{s.heading}</h2>
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.85, fontSize: 15 }}>{s.body}</div>
          </section>
        ) : null,
      )}

      {/* Yesterday's key world news — en.news ([{title, category, summary}], written by News_scrap from 2026-10-09; many days lack it)
          falls back to the Korean news_items titles so the section never disappears. */}
      {Array.isArray(en.news) && en.news.length > 0 ? (
        <section style={card}>
          <h2 style={{ color: "#00ffcc", fontSize: 17, marginTop: 0 }}>Yesterday's key world news</h2>
          <ol style={{ margin: "0 0 8px", paddingLeft: 20, lineHeight: 1.7, fontSize: 14 }}>
            {en.news.map((n, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                <strong style={{ color: "#eee" }}>{n.title}</strong>
                {n.category ? <span style={{ color: "#999", fontSize: 12, marginLeft: 6 }}>· {n.category}</span> : null}
                {n.summary ? <p style={{ margin: "3px 0 0", color: "#ccc", fontSize: 14, lineHeight: 1.7 }}>{n.summary}</p> : null}
              </li>
            ))}
          </ol>
          {b.news_day && (
            <Link href={`/archive/${b.news_day}`} hrefLang="ko" style={{ color: "#00bfff", fontSize: 13 }}>
              Full country-by-country summaries for {edate(b.news_day)} (Korean) →
            </Link>
          )}
        </section>
      ) : b.news_items?.length > 0 ? (
        <section style={card}>
          <h2 style={{ color: "#00ffcc", fontSize: 17, marginTop: 0 }}>Yesterday's key world news</h2>
          <p style={{ color: "#999", fontSize: 12, margin: "0 0 8px" }}>Headlines are in Korean (English summaries were not generated for this day).</p>
          <ol style={{ margin: "0 0 8px", paddingLeft: 20, lineHeight: 1.8, fontSize: 14 }} lang="ko">
            {b.news_items.map((n, i) => (
              <li key={i}>
                {n.category ? <span style={{ color: "#999" }}>[{n.category}] </span> : null}
                {n.title}
              </li>
            ))}
          </ol>
          {b.news_day && (
            <Link href={`/archive/${b.news_day}`} hrefLang="ko" style={{ color: "#00bfff", fontSize: 13 }}>
              Full country-by-country summaries for {edate(b.news_day)} (Korean) →
            </Link>
          )}
        </section>
      ) : null}

      {(en.keywords || []).length > 0 && (
        <p style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "4px 0 16px" }}>
          {en.keywords.map((k) => (
            <span key={k} style={{ fontSize: 12, color: "#9bd", border: "1px solid var(--line)", borderRadius: 6, padding: "3px 8px" }}>
              {k}
            </span>
          ))}
        </p>
      )}

      <p style={{ color: "#777", fontSize: 12, lineHeight: 1.7 }}>
        This briefing is an automated summary of public market data and news-broadcast summaries from several countries, for information only — not investment advice.
        Figures follow the table's source data; markets may have moved since publication.
      </p>

      <nav style={{ display: "flex", justifyContent: "space-between", marginTop: 24, fontSize: 14 }}>
        <span>{prevDay && <Link href={`/en/briefing/${prevDay}`} style={{ color: "#00ffcc" }}>← {prevDay}</Link>}</span>
        <span>{nextDay && <Link href={`/en/briefing/${nextDay}`} style={{ color: "#00ffcc" }}>{nextDay} →</Link>}</span>
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
    const [b, enList] = await Promise.all([getBriefing(day), listBriefingsEn(1000)]);
    if (!b || !b.title || !b.en || typeof b.en !== "object" || !b.en.title) return { notFound: true, revalidate: 1800 };
    const days = enList.map((x) => x.day); // 최신순
    const idx = days.indexOf(day);
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
