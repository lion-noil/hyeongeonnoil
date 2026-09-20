// 트레이딩봇 보고서 상세 — 마크다운(표 포함) 렌더. 슬러그 = "{kind}-{label}" (예: monthly-2026-08)
// ISR 10분, 요청 시 생성(blocking). ?embed=1 이면 앱 WebView용으로 사이트 내비를 숨김(SiteLayout 처리).
import Head from "next/head";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getReport, listReports, slugToId, KIND_KO } from "../../src/lib/reportsDb";
import WeeklyReportView from "../../src/components/WeeklyReportView";

const box = { maxWidth: 900, margin: "0 auto", padding: "8px 16px 40px", color: "#eee" };
const card = { background: "#242424", borderRadius: 10, padding: "16px 18px", marginBottom: 16, overflowX: "auto" };

// 마크다운 → 다크 테마 인라인 스타일 (사이트는 Tailwind 미사용)
const md = {
  h1: ({ children }) => <h1 style={{ color: "#00bfff", fontSize: 22, margin: "8px 0 12px" }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ color: "#00ffcc", fontSize: 18, margin: "22px 0 10px", borderBottom: "1px solid #333", paddingBottom: 6 }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ color: "#9bd", fontSize: 16, margin: "18px 0 8px" }}>{children}</h3>,
  p: ({ children }) => <p style={{ lineHeight: 1.8, fontSize: 15, margin: "8px 0" }}>{children}</p>,
  ul: ({ children }) => <ul style={{ lineHeight: 1.8, fontSize: 15, paddingLeft: 22 }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ lineHeight: 1.8, fontSize: 15, paddingLeft: 22 }}>{children}</ol>,
  li: ({ children }) => <li style={{ margin: "2px 0" }}>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote style={{ margin: "12px 0", padding: "8px 14px", borderLeft: "3px solid #00bfff", background: "#1e2a30", color: "#cde", fontSize: 14 }}>
      {children}
    </blockquote>
  ),
  code: ({ inline, children }) => (
    <code style={{ background: "#1a1a1a", padding: inline ? "1px 5px" : 10, borderRadius: 4, fontSize: 13, display: inline ? "inline" : "block", whiteSpace: "pre-wrap" }}>
      {children}
    </code>
  ),
  hr: () => <hr style={{ border: 0, borderTop: "1px solid #333", margin: "20px 0" }} />,
  table: ({ children }) => (
    <div style={{ overflowX: "auto", margin: "10px 0" }}>
      <table style={{ borderCollapse: "collapse", fontSize: 13, minWidth: 480, whiteSpace: "nowrap" }}>{children}</table>
    </div>
  ),
  th: ({ children }) => <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid #444", color: "#00ffcc", background: "#1f1f1f", position: "sticky", top: 0 }}>{children}</th>,
  td: ({ children }) => <td style={{ padding: "5px 10px", borderBottom: "1px solid #2e2e2e" }}>{children}</td>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" style={{ color: "#00bfff" }}>{children}</a>,
};

function fmtTs(iso) {
  const s = String(iso || "");
  return s ? `${s.slice(0, 10)} ${s.slice(11, 16)}` : "";
}

export default function ReportDetailPage({ report, prev, next }) {
  const url = `https://hyeongeonnoil.com/reports/${report.slug}`;
  const kindKo = KIND_KO[report.kind] || report.kind;
  const desc = `${kindKo} 보고서 ${report.label} — 코인(Bybit)·CFD(MT5) 봇의 셀별 성과 기록`;
  return (
    <div style={box}>
      <Head>
        <title>{report.title} | NewsInsight</title>
        <meta name="description" content={desc} key="desc" />
        <meta property="og:title" content={report.title} key="og-title" />
        <meta property="og:description" content={desc} key="og-desc" />
        <meta property="og:url" content={url} key="og-url" />
        <link rel="canonical" href={url} key="canonical" />
      </Head>

      <p style={{ color: "#888", fontSize: 13, margin: "4px 0 10px" }}>
        <Link href="/reports" style={{ color: "#00ffcc" }}>← 보고서 목록</Link>
        {"  ·  "}{kindKo} · {report.label} · 생성 {fmtTs(report.generated_at)}
      </p>

      {report.data?.cells ? (
        <>
          <h1 style={{ color: "#00bfff", fontSize: 22, margin: "4px 0 12px" }}>
            {report.title}{report.data.partial ? <span style={{ color: "#ff9f5a", fontSize: 14 }}> · 진행중</span> : null}
          </h1>
          <WeeklyReportView data={report.data} />
          <details style={{ marginTop: 16 }}>
            <summary style={{ color: "#00ffcc", cursor: "pointer", fontSize: 14 }}>📄 전체 텍스트(마크다운) 보기</summary>
            <article style={{ ...card, marginTop: 10 }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
                {report.md}
              </ReactMarkdown>
            </article>
          </details>
        </>
      ) : (
        <article style={card}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
            {report.md}
          </ReactMarkdown>
        </article>
      )}

      <nav style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
        <span>{prev && <Link href={`/reports/${prev.slug}`} style={{ color: "#00ffcc" }}>← {prev.title}</Link>}</span>
        <span>{next && <Link href={`/reports/${next.slug}`} style={{ color: "#00ffcc" }}>{next.title} →</Link>}</span>
      </nav>
    </div>
  );
}

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const id = slugToId(params.slug);
  if (!id) return { notFound: true };
  try {
    const [report, all] = await Promise.all([getReport(id), listReports()]);
    if (!report) return { notFound: true, revalidate: 120 };
    // 이전/다음 = 같은 종류(kind) 안에서만 (all 은 최신순)
    const same = all.filter((r) => r.kind === report.kind);
    const idx = same.findIndex((r) => r.id === report.id);
    return {
      props: {
        report,
        prev: idx >= 0 && idx + 1 < same.length ? same[idx + 1] : null,
        next: idx > 0 ? same[idx - 1] : null,
      },
      revalidate: 600,
    };
  } catch {
    return { notFound: true, revalidate: 60 };
  }
}
