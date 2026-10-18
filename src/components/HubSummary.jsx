// 허브 페이지(/exchange·/indexes·/commodity·/coin·/cfd·/fx·/others) 서버렌더 본문. (2026-10-18)
// HubIntro = 차트 위(유일한 h1·한 줄 소개·최근 종가/참고 시세 목록), HubGuide = 차트 아래(읽는 법·시세 페이지 링크·FAQ+FAQPage JSON-LD).
// 문장은 src/lib/hubContent.js, 숫자는 src/lib/hubDb.js(getStaticProps)에서만 온다. 차트(ssr:false)는 건드리지 않는다.
import React from "react";
import Head from "next/head";
import Link from "next/link";
import { HUBS, hubName } from "../lib/hubContent";
import { ldJson } from "../lib/jsonLd";

const UP = "#ff6b6b";
const DOWN = "#4dabf7";

const wrap = { maxWidth: 1400, margin: "0 auto", padding: "14px 16px 0", color: "var(--text-2)", fontSize: 13, lineHeight: 1.7 };
const h1s = { color: "var(--text)", fontSize: 18, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.01em" };
const p = { margin: "0 0 6px" };
const ul = { listStyle: "none", padding: 0, margin: "4px 0 0", display: "flex", flexWrap: "wrap", gap: "2px 16px", fontSize: 12.5 };
const guideWrap = { maxWidth: 960, margin: "0 auto", padding: "8px 16px 40px", color: "var(--text-2)", fontSize: 14, lineHeight: 1.8 };
const card = { background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 10, padding: "14px 18px", marginBottom: 14 };
const h2s = { color: "var(--text)", fontSize: 16, fontWeight: 700, margin: "0 0 8px" };
const h3s = { color: "var(--text)", fontSize: 14.5, fontWeight: 700, margin: "0 0 2px" };
const chip = { color: "#9bd", fontSize: 13, textDecoration: "none", border: "1px solid var(--line)", borderRadius: 6, padding: "4px 8px", display: "inline-block" };
const linkC = { color: "#9bd" };

function fmtClose(v, kind, dec) {
  const n = Number(v);
  if (v == null || !Number.isFinite(n)) return "-";
  let d = dec;
  if (d == null) {
    const a = Math.abs(n);
    d = kind === "rate" ? 3 : a >= 1000 ? 1 : a >= 10 ? 2 : 4;
  }
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
// 금리(rate)는 bp, 그 외 % — marketDataDb.computeStats 와 같은 규칙
function fmtDelta(v, kind) {
  const n = Number(v);
  if (v == null || !Number.isFinite(n)) return "-";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return kind === "rate" ? `${sign}${Math.abs(n).toFixed(1)}bp` : `${sign}${Math.abs(n).toFixed(2)}%`;
}
function tone(v) {
  const n = Number(v);
  return n > 0 ? UP : n < 0 ? DOWN : "var(--muted)";
}
function shortDate(day) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(day || ""));
  return m ? `${Number(m[2])}/${Number(m[3])}` : "";
}

function Name({ slug, children }) {
  return slug ? (
    <Link href={`/market/${slug}`} style={linkC}>
      {children}
    </Link>
  ) : (
    <span style={{ color: "var(--text)" }}>{children}</span>
  );
}

function QuoteLine({ q }) {
  return (
    <>
      <Name slug={q.slug}>{q.label}</Name> {fmtClose(q.close, q.kind, q.dec)}
      <span style={{ color: "var(--muted)" }}> ({shortDate(q.date)})</span>{" "}
      <span style={{ color: tone(q.delta) }}>전일 대비 {fmtDelta(q.delta, q.kind)}</span>
      {q.vsMa != null && <span style={{ color: "var(--muted)" }}> · MA100 대비 {fmtDelta(q.vsMa, q.kind)}</span>}
      {q.stale && <span style={{ color: "#ffd166" }}> · 데이터 지연</span>}
    </>
  );
}

// 차트 위 — 페이지의 유일한 h1
export function HubIntro({ hubKey, hub = {} }) {
  const H = HUBS[hubKey];
  const quotes = hub.quotes || [];
  const symbols = hub.symbols || [];
  const links = hub.links || [];
  const note = symbols.find((s) => s.ref?.note)?.ref;
  return (
    <section aria-label="페이지 요약" style={wrap}>
      <h1 style={h1s}>{H.h1}</h1>
      {H.intro.map((t, i) => (
        <p key={i} style={p}>{t}</p>
      ))}

      {quotes.length > 0 && (
        <>
          <p style={{ ...p, color: "var(--muted)", fontSize: 12, margin: "6px 0 0" }}>
            {H.quotesTitle} — 종목 · 종가 · (기준일) · 전일 대비 · 100일 이동평균(MA100) 대비
          </p>
          <ul style={ul}>
            {quotes.map((q) => (
              <li key={q.key}>
                <QuoteLine q={q} />
              </li>
            ))}
          </ul>
        </>
      )}

      {symbols.length > 0 && (
        <>
          <p style={{ ...p, color: "var(--muted)", fontSize: 12, margin: "6px 0 0" }}>
            {H.quotesTitle} — 심볼 · 이름 · 참고 시세(사이트 일봉 데이터·시장 브리핑 기준)
          </p>
          <ul style={{ ...ul, flexDirection: "column", gap: 2 }}>
            {symbols.map((s) => (
              <li key={s.symbol}>
                <b style={{ color: "var(--text)" }}>{s.symbol}</b> {s.name}
                {s.ref ? (
                  <>
                    {" — 참고: "}
                    <QuoteLine q={s.ref} />
                  </>
                ) : null}
              </li>
            ))}
          </ul>
          {note && (
            <p style={{ ...p, color: "var(--muted)", fontSize: 12, margin: "4px 0 0" }}>
              비트코인 참고 시세는 <Link href={note.briefingDay ? `/briefing/${note.briefingDay}` : "/briefing"} style={linkC}>{note.briefingDay ? `${note.briefingDay} 시장 브리핑` : "최신 시장 브리핑"}</Link> 시세표 값입니다({note.note}).
            </p>
          )}
        </>
      )}

      {hubKey === "others" && links.length > 0 && (
        <>
          <p style={{ ...p, color: "var(--muted)", fontSize: 12, margin: "6px 0 0" }}>{H.quotesTitle}</p>
          <ul style={ul}>
            {links.map((l) => (
              <li key={l.slug}>
                <Name slug={l.slug}>{l.name}</Name>
                {l.close != null && (
                  <>
                    {" "}
                    {fmtClose(l.close, l.kind, l.dec)}
                    <span style={{ color: "var(--muted)" }}> ({shortDate(l.date)})</span>{" "}
                    <span style={{ color: tone(l.delta) }}>{fmtDelta(l.delta, l.kind)}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

// 차트 아래 — 읽는 법·링크·FAQ. FAQPage JSON-LD 도 여기서 넣는다.
export function HubGuide({ hubKey, hub = {} }) {
  const H = HUBS[hubKey];
  const links = hub.links || [];
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: H.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <div style={guideWrap}>
      <Head>
        <script type="application/ld+json" key="hub-faq" dangerouslySetInnerHTML={{ __html: ldJson(faqLd) }} />
      </Head>

      <section style={card}>
        <h2 style={h2s}>{H.guideTitle}</h2>
        {H.guide &&
          H.guide.map((t, i) => (
            <p key={i} style={{ margin: "0 0 8px" }}>{t}</p>
          ))}
        {H.sections && (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {H.sections.map((s) => (
              <li key={s.path} style={{ marginBottom: 4 }}>
                <Link href={s.path} style={linkC}>{hubName(s.path)}</Link> — {s.desc}
              </li>
            ))}
          </ul>
        )}
      </section>

      {hubKey !== "others" && (
        <nav aria-label="관련 시세 페이지" style={card}>
          <h2 style={h2s}>관련 시세 페이지</h2>
          {links.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {links.map((l) => (
                <Link key={l.slug} href={`/market/${l.slug}`} style={chip}>
                  {l.name}
                  {l.close != null && (
                    <span style={{ color: tone(l.delta), marginLeft: 6 }}>
                      {fmtClose(l.close, l.kind, l.dec)} {fmtDelta(l.delta, l.kind)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : null}
          <p style={{ margin: "10px 0 0" }}>
            <Link href="/briefing" style={{ color: "#00ffcc" }}>오늘의 시장 브리핑</Link>
            {" · "}
            <Link href="/market" style={linkC}>시세 페이지 전체 목록</Link>
            {H.hubs.map((h) => (
              <React.Fragment key={h}>
                {" · "}
                <Link href={h} style={linkC}>{hubName(h)}</Link>
              </React.Fragment>
            ))}
          </p>
        </nav>
      )}

      <section style={card}>
        <h2 style={h2s}>자주 묻는 질문</h2>
        {H.faq.map((f) => (
          <div key={f.q} style={{ marginBottom: 10 }}>
            <h3 style={h3s}>{f.q}</h3>
            <p style={{ margin: 0 }}>{f.a}</p>
          </div>
        ))}
      </section>

      <p style={{ color: "var(--muted)", fontSize: 12, margin: 0 }}>
        모든 수치는 정보 제공 목적이며 투자 권유가 아닙니다. 과거 수치는 미래를 보장하지 않습니다.
      </p>
    </div>
  );
}
