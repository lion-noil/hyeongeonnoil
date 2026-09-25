// 시장 브리핑 목록 — 매일 아침 1편, 최신순 (2026-09-25)
import Head from "next/head";
import Link from "next/link";
import { listBriefings } from "../../src/lib/briefingDb";

const box = { maxWidth: 780, margin: "0 auto", padding: "8px 16px 40px", color: "#eee" };

function kdate(day) {
  const [y, m, d] = day.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

export default function BriefingIndex({ items }) {
  return (
    <div style={box}>
      <Head>
        <title>시장 브리핑 — 매일 아침 환율·금리·증시 한 장 정리 | NewsInsight</title>
        <meta
          name="description"
          content="달러 환율, 미국 10년물 금리, 코스피200·나스닥100, 원유·금·비트코인의 어제 종가와 세계 뉴스를 매일 아침 한 편으로 정리합니다."
          key="desc"
        />
        <link rel="canonical" href="https://hyeongeonnoil.com/briefing" key="canonical" />
      </Head>
      <h1 style={{ color: "#00bfff", fontSize: 24 }}>시장 브리핑</h1>
      <p style={{ color: "#999", fontSize: 14, lineHeight: 1.7 }}>
        어제 종가 기준 환율·금리·증시·원자재·코인 시세표와, 각국 뉴스 방송 요약에서 뽑은 핵심 뉴스를 연결해 매일 아침 한 편으로 정리합니다.
        정보 정리이며 투자 권유가 아닙니다.
      </p>
      {!items.length && <p style={{ color: "#888" }}>첫 브리핑은 다음 거래일 아침에 올라옵니다.</p>}
      {items.map((it) => (
        <article key={it.day} style={{ background: "#242424", borderRadius: 10, padding: "14px 18px", marginBottom: 12 }}>
          <p style={{ color: "#999", fontSize: 12, margin: "0 0 4px" }}>{kdate(it.day)} · 시세 기준 {it.data_date} 종가</p>
          <h2 style={{ fontSize: 18, margin: "0 0 6px", lineHeight: 1.4 }}>
            <Link href={`/briefing/${it.day}`} style={{ color: "#00ffcc", textDecoration: "none" }}>
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
    return { props: { items: await listBriefings(60) }, revalidate: 900 };
  } catch {
    return { props: { items: [] }, revalidate: 300 };
  }
}
