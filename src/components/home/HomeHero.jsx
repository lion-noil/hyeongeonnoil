// 홈 첫 화면 — 3D 지구본(세계정세 실데이터) + 브랜드 문구 + 바로가기. (2026-09-28 리디자인)
import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import useIsMobile from "../../hooks/useIsMobile";
import { useCurrentTime } from "../../hooks/useCurrentTime";
import { useGlobeData, relColor } from "../three/globeData";

const HeroGlobe = dynamic(() => import("../three/HeroGlobe"), {
  ssr: false,
  loading: () => <div className="hero-globe hero-globe--loading" />,
});

const LEGEND = [
  { s: 4, label: "동맹" },
  { s: 2, label: "우호" },
  { s: 0, label: "중립" },
  { s: -2, label: "긴장" },
  { s: -3, label: "적대" },
];

function fmtUpdated(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return "";
  }
}

export default function HomeHero() {
  const isMobile = useIsMobile();
  const now = useCurrentTime();
  const { countries, relations, updatedAt, live } = useGlobeData();
  const tense = relations.filter((r) => r.s < 0).length;
  const friendly = relations.filter((r) => r.s >= 2).length;

  return (
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow">
          <span className="live-dot" /> LIVE · GLOBAL MARKETS &amp; NEWS
        </div>
        {/* h1 은 pages/index.jsx 의 서버렌더 요약(SeoSummary)이 맡음 → 히어로 제목은 h2(.hero-title 스타일 동일) */}
        <h2 className="hero-title">
          세계의 흐름을
          <br />
          <span className="grad-text">한 화면에서</span>
        </h2>
        <p className="hero-sub">
          8개국 뉴스를 매일 요약하고, 나라 사이의 긴장과 협력을 지구본 위에 그립니다. 환율·지수·원자재·코인 시세와 자동매매 성적까지 함께 봅니다.
        </p>
        <div className="hero-clock">
          <b>{now.time}</b>
          <span>{now.date}</span>
        </div>
        <div className="hero-cta">
          <Link href="/briefing" className="btn btn-primary">오늘 시장 브리핑 →</Link>
          <Link href="/archive" className="btn btn-ghost">뉴스 아카이브</Link>
        </div>
        <div className="hero-stats">
          <div><b>8</b><span>추적 국가</span></div>
          <div><b style={{ color: relColor(3) }}>{friendly}</b><span>우호 관계</span></div>
          <div><b style={{ color: relColor(-3) }}>{tense}</b><span>긴장 관계</span></div>
        </div>
      </div>

      <div className="hero-visual">
        <HeroGlobe countries={countries} relations={relations} height={isMobile ? 360 : 560} />
        <div className="globe-legend">
          {LEGEND.map((l) => (
            <span key={l.label}>
              <i style={{ background: relColor(l.s) }} />
              {l.label}
            </span>
          ))}
          <em>{live ? `세계정세 ${fmtUpdated(updatedAt)} 기준` : "예시 데이터"} · 드래그로 회전</em>
        </div>
      </div>
    </section>
  );
}
