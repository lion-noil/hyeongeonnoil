// /en/archive — English guide to the (Korean-only) world news digest. (2026-10-09)
//   The daily digests are not translated, so this page explains what they are and links the last 14 days (Korean pages)
//   with the same headlines the Korean archive titles use (extractHeadlines). English summaries of the top stories live in the English briefing.
import Head from "next/head";
import Link from "next/link";
import { ldJson } from "../../../src/lib/jsonLd";
import { getRecentDaySummaries } from "../../../src/lib/archiveDb";
import { extractHeadlines } from "../../../src/lib/archiveHeadlines";

const SITE = "https://hyeongeonnoil.com";
const TITLE = "World News Digest (Korean) — daily summaries of broadcasts from 8 countries | NewsInsight";
const DESC =
  "Daily Korean-language summaries of the main news broadcasts from the US, China, Japan, India, Hong Kong, Korea, Germany and the UK. English summaries of yesterday's top stories are in each English market briefing.";

const box = { maxWidth: 780, margin: "0 auto", padding: "8px 16px 40px", color: "#eee" };
const card = { background: "var(--panel-2)", borderRadius: 10, padding: "16px 18px", marginBottom: 16 };
const MONTH_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COUNTRY_EN = { USA: "US", China: "China", Japan: "Japan", India: "India", HongKong: "Hong Kong", Korea: "Korea", Germany: "Germany", UK: "UK", Russia: "Russia", France: "France", Taiwan: "Taiwan", Vietnam: "Vietnam" };

function edate(day) {
  const [y, m, d] = String(day).split("-").map(Number);
  return `${MONTH_EN[m - 1]} ${d}, ${y}`;
}

export default function ArchiveGuideEn({ items = [] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: TITLE,
    description: DESC,
    url: `${SITE}/en/archive`,
    inLanguage: "en",
    hasPart: items.map((it) => ({ "@type": "WebPage", name: `${edate(it.day)} world news digest (Korean)`, url: `${SITE}/archive/${it.day}`, inLanguage: "ko" })),
  };
  return (
    <div style={box} lang="en">
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESC} key="desc" />
        <meta property="og:title" content={TITLE} key="og-title" />
        <meta property="og:description" content={DESC} key="og-desc" />
        <meta property="og:url" content={`${SITE}/en/archive`} key="og-url" />
        <meta property="og:locale" content="en_US" key="og-locale" />
        <link rel="canonical" href={`${SITE}/en/archive`} key="canonical" />
        <link rel="alternate" hrefLang="ko" href={`${SITE}/archive`} key="alt-ko" />
        <link rel="alternate" hrefLang="en" href={`${SITE}/en/archive`} key="alt-en" />
        <link rel="alternate" hrefLang="x-default" href={`${SITE}/archive`} key="alt-x" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(jsonLd) }} />
      </Head>

      <p style={{ color: "#999", fontSize: 13, margin: "8px 0 4px", display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <span><Link href="/en" style={{ color: "#9bd" }}>EN Home</Link> › World news digest</span>
        <Link href="/archive" hrefLang="ko" style={{ color: "#9bd" }}>한국어</Link>
      </p>
      <h1 style={{ color: "#00bfff", fontSize: 24, lineHeight: 1.35 }}>World news digest (Korean)</h1>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: "#ccc" }}>
        Every day NewsInsight summarizes the main news broadcasts from the US, China, Japan, India, Hong Kong, Korea, Germany and the UK — one
        summary per country, with a link to the original video. The digests are written in Korean only and are not translated.
      </p>
      <section style={card}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: "#ddd" }}>
          <strong>Looking for English?</strong> English summaries of yesterday's top stories are in each{" "}
          <Link href="/en/briefing" style={{ color: "#00ffcc" }}>English market briefing</Link>, under "Yesterday's key world news".
        </p>
      </section>

      <h2 style={{ color: "#00ffcc", fontSize: 18 }}>Last 14 days</h2>
      {!items.length && <p style={{ color: "#888" }}>The list could not be loaded. Browse the full archive at <Link href="/archive" style={{ color: "#00ffcc" }}>/archive</Link>.</p>}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.map((it) => (
          <li key={it.day} style={{ padding: "9px 0", borderTop: "1px solid var(--line)", fontSize: 14, lineHeight: 1.6 }}>
            <Link href={`/archive/${it.day}`} hrefLang="ko" style={{ color: "#00ffcc", textDecoration: "none", fontWeight: 600 }}>
              {edate(it.day)}
            </Link>
            <span style={{ color: "#999", fontSize: 12, marginLeft: 8 }}>
              {it.countries.map((c) => COUNTRY_EN[c] || c).join(" · ")}
            </span>
            {it.headlines.length > 0 && (
              <div lang="ko" style={{ color: "#ccc", fontSize: 13, marginTop: 2 }}>{it.headlines.join(" · ")}</div>
            )}
          </li>
        ))}
      </ul>
      <p style={{ fontSize: 13, margin: "14px 0 0" }}>
        <Link href="/archive" hrefLang="ko" style={{ color: "#00bfff" }}>Full archive (Korean) →</Link>
      </p>
      <p style={{ color: "#777", fontSize: 12, lineHeight: 1.7, marginTop: 18 }}>
        Summaries are produced automatically from public broadcasts (speech recognition + LLM) and may differ from the originals; each page links
        the source video. Information only.
      </p>
    </div>
  );
}

export async function getStaticProps() {
  try {
    const rows = await getRecentDaySummaries(14);
    const items = rows.map((r) => ({ day: r.day, countries: Object.keys(r.countries), headlines: extractHeadlines(r.countries, 3) }));
    return { props: { items }, revalidate: 3600 };
  } catch {
    return { props: { items: [] }, revalidate: 300 };
  }
}
