// Market briefing list (English) — only days that carry an `en` block. (2026-10-09)
import Head from "next/head";
import Link from "next/link";
import { listBriefingsEn } from "../../../src/lib/briefingDb";

const SITE = "https://hyeongeonnoil.com";
const box = { maxWidth: 780, margin: "0 auto", padding: "8px 16px 40px", color: "#eee" };
const MONTH_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function edate(day) {
  const [y, m, d] = String(day).split("-").map(Number);
  return `${MONTH_EN[m - 1]} ${d}, ${y}`;
}

export default function BriefingIndexEn({ items }) {
  const title = "Daily Market Briefing — FX, rates, equities and commodities with world news | NewsInsight";
  const desc = "One page every morning (KST): yesterday's closes for USD/KRW, US 10-year yield, KOSPI 200, Nasdaq 100, crude, gold and Bitcoin, linked to the day's world news.";
  return (
    <div style={box} lang="en">
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} key="desc" />
        <meta property="og:title" content={title} key="og-title" />
        <meta property="og:description" content={desc} key="og-desc" />
        <meta property="og:url" content={`${SITE}/en/briefing`} key="og-url" />
        <meta property="og:locale" content="en_US" key="og-locale" />
        <link rel="canonical" href={`${SITE}/en/briefing`} key="canonical" />
        <link rel="alternate" hrefLang="ko" href={`${SITE}/briefing`} key="alt-ko" />
        <link rel="alternate" hrefLang="en" href={`${SITE}/en/briefing`} key="alt-en" />
        <link rel="alternate" hrefLang="x-default" href={`${SITE}/briefing`} key="alt-x" />
      </Head>
      <p style={{ color: "#999", fontSize: 13, margin: "8px 0 4px", textAlign: "right" }}>
        <Link href="/briefing" style={{ color: "#9bd" }}>한국어</Link>
      </p>
      <h1 style={{ color: "#00bfff", fontSize: 24 }}>Daily Market Briefing</h1>
      <p style={{ color: "#999", fontSize: 14, lineHeight: 1.7 }}>
        {desc} Information only, not investment advice. Daily price pages: <Link href="/en/market" style={{ color: "#00ffcc" }}>Markets</Link>.
      </p>
      {!items.length && <p style={{ color: "#888" }}>No English briefings yet. The Korean edition is at <Link href="/briefing" style={{ color: "#00ffcc" }}>/briefing</Link>.</p>}
      {items.map((it) => (
        <article key={it.day} style={{ background: "var(--panel-2)", borderRadius: 10, padding: "14px 18px", marginBottom: 12 }}>
          <p style={{ color: "#999", fontSize: 12, margin: "0 0 4px" }}>{edate(it.day)} · prices as of {it.data_date} close</p>
          <h2 style={{ fontSize: 18, margin: "0 0 6px", lineHeight: 1.4 }}>
            <Link href={`/en/briefing/${it.day}`} style={{ color: "#00ffcc", textDecoration: "none" }}>
              {it.title}
            </Link>
          </h2>
          <p style={{ color: "#ccc", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{it.lead}</p>
        </article>
      ))}
    </div>
  );
}

export async function getStaticProps() {
  try {
    return { props: { items: await listBriefingsEn(60) }, revalidate: 900 };
  } catch {
    return { props: { items: [] }, revalidate: 300 };
  }
}
