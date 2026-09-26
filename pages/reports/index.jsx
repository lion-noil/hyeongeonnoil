// 트레이딩봇 보고서 목록 — 월간(셀별 성과)·심층(MFE/MAE)·주간(운영 점검)
// ISR 10분: 보고서는 매월 1일 07:30(월간) 등 드물게 갱신됨. 원천 = Upstash trading:reports
import Head from "next/head";
import Link from "next/link";
import { listReports, getReport, KIND_KO } from "../../src/lib/reportsDb";
import PerfView from "../../src/components/PerfView";

const box = { maxWidth: 780, margin: "0 auto", padding: "8px 16px 40px", color: "#eee" };
const card = { background: "#242424", borderRadius: 10, padding: "14px 18px", marginBottom: 12, display: "block", textDecoration: "none", color: "#eee" };
const badge = (kind) => ({
  display: "inline-block", fontSize: 12, padding: "2px 8px", borderRadius: 6, marginRight: 8,
  color: kind === "weekly" ? "#ffd479" : kind === "deep" ? "#c7a2ff" : "#00ffcc",
  border: `1px solid ${kind === "weekly" ? "#8a6d2a" : kind === "deep" ? "#5f4a8a" : "#1f6b5e"}`,
});

function fmtTs(iso) {
  if (!iso) return "";
  const s = String(iso);
  return `${s.slice(0, 10)} ${s.slice(11, 16)}`;
}

export default function ReportsPage({ reports, perf }) {
  return (
    <div style={box}>
      <Head>
        <title>트레이딩봇 보고서 — 월간 셀별 성과·심층 분석 | NewsInsight</title>
        <meta
          name="description"
          content="코인(Bybit)·CFD(MT5) 자동매매 봇의 월간 심볼×전략 성과 보고서와 심층 분석 기록입니다."
          key="desc"
        />
        <link rel="canonical" href="https://hyeongeonnoil.com/reports" key="canonical" />
      </Head>

      <h1 style={{ color: "#00bfff", fontSize: 24 }}>📑 트레이딩봇 보고서</h1>
      <p style={{ color: "#999", fontSize: 13, lineHeight: 1.7 }}>
        매월 1일 자동 생성되는 셀(계좌×심볼×책×전략)별 성과 보고서와 심층 분석입니다.
        판정 원칙: 1개월 표본은 노이즈 — 🔴 2개월 연속 또는 백테스트 최악연도 초과 시에만 파라미터 재검토.
      </p>

      {perf?.data && <PerfView data={perf.data} compact />}

      <h2 style={{ color: "#00ffcc", fontSize: 17, margin: "18px 0 8px" }}>보고서</h2>
      {!reports.length && (
        <div style={{ ...card, color: "#999" }}>아직 발행된 보고서가 없습니다.</div>
      )}

      {reports.map((r) => (
        <Link key={r.id} href={`/reports/${r.slug}`} style={card}>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
            <span style={badge(r.kind)}>{KIND_KO[r.kind] || r.kind}</span>
            <span style={{ color: "#00ffcc", fontSize: 16, fontWeight: 600 }}>{r.title}</span>
          </div>
          <div style={{ color: "#888", fontSize: 12, marginTop: 6 }}>
            {r.subtitle ? `${r.subtitle} · ` : `${r.label} · `}생성 {fmtTs(r.generated_at)}
          </div>
        </Link>
      ))}
    </div>
  );
}

export async function getStaticProps() {
  try {
    const [all, perf] = await Promise.all([listReports(), getReport("perf:latest").catch(() => null)]);
    return { props: { reports: all.filter((r) => r.kind !== "perf"), perf: perf || null }, revalidate: 600 };
  } catch {
    return { props: { reports: [], perf: null }, revalidate: 120 };
  }
}
