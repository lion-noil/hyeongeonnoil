// English hub (/en) — entry page for English visitors and crawlers. (2026-10-09)
//   Today's (or latest) English briefing, 13 market cards from getMarketOverview, the last 7 English briefings,
//   and links to the Korean site. All server-rendered text; 10-minute ISR. Any failing source just drops its block.
import Head from "next/head";
import Link from "next/link";
import { ldJson } from "../../src/lib/jsonLd";
import { MARKET_TOPICS } from "../../src/lib/marketTopics";
import { MARKET_DICT, fmtDelta } from "../../src/components/MarketTopicPage";
import { getLatestBriefing, listBriefingsEn } from "../../src/lib/briefingDb";
import { getMarketOverview } from "../../src/lib/marketDataDb";

const SITE = "https://hyeongeonnoil.com";
const TITLE = "NewsInsight — Daily Korea Market Briefing in English | FX, Rates, Equities";
const DESC =
  "Daily Korea market briefing in English, 13 live market pages (USD/KRW, JPY/KRW, US and Korean yields, KOSPI 200, Nasdaq 100, gold, WTI) updated every day, and a world news digest from 8 countries' broadcasts.";

const box = { maxWidth: 900, margin: "0 auto", padding: "8px 16px 40px", color: "#eee" };
const card = { background: "var(--panel-2)", borderRadius: 10, padding: "16px 18px", marginBottom: 16 };
const h2 = { color: "#00ffcc", fontSize: 18, margin: "0 0 10px" };
const MONTH_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function edate(day) {
  const [y, m, d] = String(day).split("-").map(Number);
  return `${MONTH_EN[m - 1]} ${d}, ${y}`;
}
function color(v) {
  const n = Number(v);
  return n > 0 ? "#ff6b6b" : n < 0 ? "#4dabf7" : "#bbb";
}

const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "NewsInsight",
  alternateName: "현건노일 NewsInsight",
  url: `${SITE}/en`,
  description: DESC,
  inLanguage: "en",
  publisher: { "@type": "Organization", name: "NewsInsight", url: SITE },
};

const GROUPS = [["Currencies", "currency"], ["Rates", "treasury"], ["Equity indices", "index"], ["Commodities", "commodity"]];

export default function EnHome({ briefing = null, recent = [], market = [] }) {
  const d = MARKET_DICT.en;
  return (
    <div style={box} lang="en">
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESC} key="desc" />
        <meta property="og:title" content={TITLE} key="og-title" />
        <meta property="og:description" content={DESC} key="og-desc" />
        <meta property="og:url" content={`${SITE}/en`} key="og-url" />
        <meta property="og:locale" content="en_US" key="og-locale" />
        <link rel="canonical" href={`${SITE}/en`} key="canonical" />
        <link rel="alternate" hrefLang="en" href={`${SITE}/en`} key="alt-en" />
        <link rel="alternate" hrefLang="ko" href={`${SITE}/`} key="alt-ko" />
        <link rel="alternate" hrefLang="x-default" href={`${SITE}/`} key="alt-x" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(WEBSITE_LD) }} />
      </Head>

      <p style={{ color: "#999", fontSize: 13, margin: "8px 0 4px", textAlign: "right" }}>
        <Link href="/" hrefLang="ko" style={{ color: "#9bd" }}>한국어 사이트</Link>
      </p>
      <h1 style={{ color: "#00bfff", fontSize: 26, lineHeight: 1.3, marginTop: 4 }}>
        NewsInsight — Korea market briefing, FX &amp; rates data, world news digest
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: "#ccc" }}>
        NewsInsight is an independent, automated dashboard from Korea. Every morning (KST) it publishes a{" "}
        <Link href="/en/briefing" style={{ color: "#00ffcc" }}>Korea market briefing in English</Link> that ties yesterday's closes to the day's world
        news; it keeps <Link href="/en/market" style={{ color: "#00ffcc" }}>13 live market pages</Link> (won, yen, dollar index, US and Korean yields,
        KOSPI 200, Nasdaq 100, Nikkei, Hang Seng, DAX, gold, WTI) updated daily with close, day/week/month change and position versus the 100-day
        average; and it archives a <Link href="/en/archive" style={{ color: "#00ffcc" }}>world news digest</Link> built from the main news broadcasts of 8
        countries (US, China, Japan, India, Hong Kong, Korea, Germany, UK). Information only, not investment advice.
      </p>

      <section style={card} aria-labelledby="today-briefing">
        <h2 id="today-briefing" style={h2}>{briefing && briefing.isLatest ? "Today's briefing" : "Latest English briefing"}</h2>
        {briefing ? (
          <article>
            <p style={{ color: "#999", fontSize: 12, margin: "0 0 4px" }}>
              {edate(briefing.day)}{briefing.data_date ? ` · prices as of ${briefing.data_date} close` : ""}
            </p>
            <h3 style={{ fontSize: 19, lineHeight: 1.4, margin: "0 0 6px" }}>
              <Link href={`/en/briefing/${briefing.day}`} style={{ color: "#00ffcc", textDecoration: "none" }}>{briefing.title}</Link>
            </h3>
            <p style={{ color: "#ccc", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{briefing.lead}</p>
          </article>
        ) : (
          <p style={{ color: "#888", margin: 0 }}>
            No English briefing is available right now. The Korean edition is at <Link href="/briefing" style={{ color: "#00ffcc" }}>/briefing</Link>.
          </p>
        )}
      </section>

      <section style={{ marginBottom: 16 }} aria-labelledby="markets-h">
        <h2 id="markets-h" style={h2}>
          <Link href="/en/market" style={{ color: "#00ffcc", textDecoration: "none" }}>Markets</Link>
          <span style={{ color: "#999", fontSize: 13, fontWeight: 400, marginLeft: 8 }}>latest close · day change</span>
        </h2>
        {!market.length && <p style={{ color: "#888" }}>Market data could not be loaded.</p>}
        {GROUPS.map(([label, cat]) => {
          const items = MARKET_TOPICS.filter((t) => t.cat === cat && market.some((o) => o.slug === t.slug));
          if (!items.length) return null;
          return (
            <div key={cat} style={{ marginBottom: 12 }}>
              <h3 style={{ color: "#bbb", fontSize: 14, margin: "0 0 6px", fontWeight: 600 }}>{label}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                {items.map((t) => {
                  const o = market.find((x) => x.slug === t.slug);
                  return (
                    <Link key={t.slug} href={`/en/market/${t.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <article style={{ background: "var(--panel-2)", borderRadius: 10, padding: "12px 14px", height: "100%" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#eee" }}>{t.en.name}</div>
                        <div style={{ fontSize: 19, fontWeight: 700, color: "#fff", margin: "4px 0 2px" }}>{d.val(o.close, t)}</div>
                        <div style={{ fontSize: 13, color: color(o.delta) }}>
                          {fmtDelta(o.delta, t.kind)} <span style={{ color: "#777" }}>· {o.date}{o.stale ? " · delayed" : ""}</span>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      <section style={card} aria-labelledby="recent-h">
        <h2 id="recent-h" style={h2}>Recent English briefings</h2>
        {recent.length ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {recent.map((it) => (
              <li key={it.day} style={{ padding: "7px 0", borderTop: "1px solid var(--line)", fontSize: 14, lineHeight: 1.5 }}>
                <span style={{ color: "#999", fontSize: 12, marginRight: 8 }}>{edate(it.day)}</span>
                <Link href={`/en/briefing/${it.day}`} style={{ color: "#00ffcc", textDecoration: "none" }}>{it.title}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "#888", margin: 0 }}>No English briefings yet.</p>
        )}
        <p style={{ margin: "10px 0 0", fontSize: 13 }}>
          <Link href="/en/briefing" style={{ color: "#00bfff" }}>All English briefings →</Link>
        </p>
      </section>

      <p style={{ color: "#999", fontSize: 13, lineHeight: 1.8 }}>
        Korean site: <Link href="/" hrefLang="ko" style={{ color: "#9bd" }}>한국어 사이트</Link> · Korean briefing{" "}
        <Link href="/briefing" hrefLang="ko" style={{ color: "#9bd" }}>/briefing</Link> · World news digest (Korean){" "}
        <Link href="/archive" hrefLang="ko" style={{ color: "#9bd" }}>/archive</Link>
      </p>
      <p style={{ color: "#777", fontSize: 12, lineHeight: 1.7 }}>
        Automated summaries of public market data and news broadcasts, for information only — not investment advice. Figures follow the source
        data of each page; markets may have moved since publication.
      </p>
    </div>
  );
}

// Latest briefing (en block if present, else the newest day that has one), last 7 English briefings, all market closes — 10-minute ISR.
export async function getStaticProps() {
  const [latest, recent, market] = await Promise.all([
    getLatestBriefing().catch(() => null),
    listBriefingsEn(7).catch(() => []),
    getMarketOverview().catch(() => []),
  ]);
  let briefing = null;
  if (latest && latest.day && latest.en && typeof latest.en === "object" && latest.en.title) {
    briefing = { day: latest.day, title: latest.en.title, lead: latest.en.lead || "", data_date: latest.data_date || "", isLatest: true };
  } else if (recent.length) {
    briefing = { ...recent[0], isLatest: false };
  }
  return { props: { briefing, recent, market }, revalidate: 600 };
}
