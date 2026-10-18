// 검증 기록 — 환율 유니버스 봇의 제3자 검증 기록 모음 (2026-10-19)
// 1) FX Blue 실시간 현황판(Publisher EA 발행) 2) Myfxbook 검증 배지(투자자 비번 직접 접속) 3) QuantConnect 독립 엔진·데이터 백테스트(공개 링크)
// 숫자·링크는 src/data/verified.json (reversion_research/platforms/quantconnect/publish_site.py 가 갱신). 정적 페이지.
import Head from "next/head";
import Link from "next/link";
import V from "../src/data/verified.json";
import { ldJson, ORG } from "../src/lib/jsonLd";

const SITE = "https://hyeongeonnoil.com";
const TITLE = "검증 기록 — 환율 자동매매 봇의 제3자 검증(FX Blue·Myfxbook·QuantConnect) | NewsInsight";
const DESC = "환율 7종 자동매매 봇(MT5 데모)의 외부 검증 기록입니다. FX Blue 실시간 현황판, Myfxbook 검증 배지, QuantConnect 독립 백테스트 결과와 그 한계를 함께 적었습니다.";

const PAGE_LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebPage", name: "검증 기록 — 환율 자동매매 봇의 제3자 검증", url: `${SITE}/verified`, description: DESC, inLanguage: "ko",
      isPartOf: { "@type": "WebSite", name: "현건노일 NewsInsight", url: SITE }, publisher: ORG, dateModified: V.updated },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "검증 기록", item: `${SITE}/verified` } ] },
  ],
};

const box = { maxWidth: 860, margin: "0 auto", padding: "8px 16px 40px", color: "#eee" };
const card = { background: "var(--panel-2)", borderRadius: 10, padding: "16px 18px", marginBottom: 16 };
const h2 = { color: "#00ffcc", fontSize: 18, margin: "22px 0 10px", borderBottom: "1px solid var(--line)", paddingBottom: 6 };
const p = { lineHeight: 1.8, fontSize: 15, margin: "8px 0" };
const small = { color: "#999", fontSize: 13, lineHeight: 1.7 };
const btn = { display: "inline-block", padding: "6px 12px", borderRadius: 6, border: "1px solid #1f6b5e", color: "#00ffcc", textDecoration: "none", fontSize: 13, marginRight: 8, marginTop: 6 };
const badge = { display: "inline-block", fontSize: 12, padding: "2px 8px", borderRadius: 6, marginRight: 6, color: "#9f9", border: "1px solid #2a6a2a" };
const frame = { width: "100%", border: 0, borderRadius: 8, background: "#111" };

function Ext({ href, children }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" style={btn}>{children} ↗</a>;
}

export default function VerifiedPage() {
  const q = V.quantconnect;
  return (
    <div style={box}>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESC} key="desc" />
        <link rel="canonical" href={`${SITE}/verified`} key="canonical" />
        <meta property="og:title" content={TITLE} key="og-title" />
        <meta property="og:description" content={DESC} key="og-desc" />
        <meta property="og:url" content={`${SITE}/verified`} key="og-url" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(PAGE_LD) }} />
      </Head>

      <h1 style={{ color: "#00bfff", fontSize: 24 }}>🔎 검증 기록</h1>
      <p style={small}>
        {V.account.label}에서 돌아가는 봇의 기록을 <b>제가 아닌 제3자 서버</b>가 집계·검증한 것만 모았습니다.
        사이트의 <Link href="/reports" style={{ color: "#00ffcc" }}>보고서</Link>와 <Link href="/fx" style={{ color: "#00ffcc" }}>FX 현황</Link>은 자체 장부 기준이고, 이 페이지는 그 장부를 바깥에서 대조하는 용도입니다.
        {" "}{V.account.note} 가동 {V.account.live_since}~. 기준일 {V.updated}.
      </p>

      {/* 1. FX Blue */}
      <h2 style={h2}>1. 실시간 현황판 — FX Blue</h2>
      <div style={card}>
        <p style={p}>{V.fxblue.how} 공개 사용자명 <code>{V.fxblue.user}</code>, 발행 시작 {V.fxblue.since}.</p>
        <iframe src={V.fxblue.chart_embed} title="FX Blue 누적 손익 차트" loading="lazy" style={{ ...frame, height: 240 }} />
        <div>
          <Ext href={V.fxblue.stats_url}>FX Blue 통계 페이지</Ext>
          <Ext href={V.fxblue.page_url}>거래 내역</Ext>
        </div>
      </div>

      {/* 2. Myfxbook */}
      <h2 style={h2}>2. 검증 배지 — Myfxbook</h2>
      <div style={card}>
        <div style={{ marginBottom: 6 }}>{V.myfxbook.badges.map((b) => <span key={b} style={badge}>✓ {b}</span>)}</div>
        <p style={p}>{V.myfxbook.how} 연결 {V.myfxbook.since}. 거래 이력은 연결 뒤 동기화된 분부터 쌓입니다.</p>
        <Ext href={V.myfxbook.url}>Myfxbook 계좌 페이지</Ext>
      </div>

      {/* 3. QuantConnect */}
      <h2 style={h2}>3. 독립 엔진·데이터 백테스트 — QuantConnect</h2>
      <div style={card}>
        <p style={p}>
          같은 규칙(환율 셀 17개, 라이브와 동일한 사이징)을 QuantConnect LEAN 엔진용으로 다시 구현해 <b>다른 데이터 공급자(Oanda)·다른 엔진·다른 체결 모델</b>로 돌린 결과입니다.
          {" "}{q.cell_match}. 기간 {q.period}, 실행 {q.run_at}, {q.engine}.
        </p>
        <table style={{ borderCollapse: "collapse", fontSize: 14, margin: "8px 0 12px" }}>
          <tbody>
            {q.stats.map(([k, v]) => (
              <tr key={k}>
                <td style={{ padding: "4px 14px 4px 0", color: "#9bd", whiteSpace: "nowrap" }}>{k}</td>
                <td style={{ padding: "4px 0" }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <iframe src={q.url} title="QuantConnect 공개 백테스트 결과" loading="lazy" style={{ ...frame, height: 620 }} />
        <Ext href={q.url}>QuantConnect 공개 결과 전체 보기</Ext>
      </div>

      {/* 4. 정직한 해석 */}
      <h2 style={h2}>4. 숫자를 그대로 믿으면 안 되는 이유</h2>
      <div style={card}>
        <ol style={{ lineHeight: 1.8, fontSize: 15, paddingLeft: 22, margin: 0 }}>
          {q.caveats.map((c, i) => <li key={i} style={{ margin: "4px 0" }}>{c}</li>)}
        </ol>
        <p style={{ ...p, marginTop: 12 }}><b>{q.expectation}.</b> 위 백테스트 수치는 "규칙이 외부에서 재현된다"는 증거이지, 앞으로의 수익 약속이 아닙니다.
          앞으로의 성적은 1·2번의 실시간 기록이 쌓이면서 드러납니다.</p>
      </div>

      <p style={small}>
        이 페이지는 투자 권유가 아닙니다. 모든 기록은 데모 계좌이며, 실계좌 성과·수수료·슬리피지는 다를 수 있습니다.
        월간·주간 자체 보고서는 <Link href="/reports" style={{ color: "#00ffcc" }}>보고서</Link>에서 볼 수 있습니다.
      </p>
    </div>
  );
}
