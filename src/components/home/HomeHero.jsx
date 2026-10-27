// 홈 첫 화면 — 3D 지구본(세계정세 실데이터) + 브랜드 문구 + 바로가기. (2026-09-28 리디자인)
// 2026-10-27: 세계정세 현황판을 지구본과 통합 — 선택 상태(selected)를 여기서 들고 지구본·WorldStatePanel 이 공유.
//   데이터는 useGlobeData 한 번(종전엔 지구본·현황판이 각각 /api/world-state 를 불렀음).
//   딥링크 /#state=Korea → 그 나라가 선택된 채 시작.
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import useIsMobile from "../../hooks/useIsMobile";
import { useCurrentTime } from "../../hooks/useCurrentTime";
import { useGlobeData, relColor, CAPITALS } from "../three/globeData";
import { REL_SCALE } from "../../lib/theme";
import WorldStatePanel from "./WorldStatePanel";

const TRACKED = Object.keys(CAPITALS).length; // 추적 국가 수 — 지구본 수도 목록 기준(국가 추가 시 자동)

const HeroGlobe = dynamic(() => import("../three/HeroGlobe"), {
  ssr: false,
  loading: () => <div className="hero-globe hero-globe--loading" />,
});

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
  const { countries, relations, updatedAt, live, data } = useGlobeData();
  const tense = relations.filter((r) => r.s < 0).length;
  const friendly = relations.filter((r) => r.s >= 2).length;

  const [selected, setSelected] = useState(null);
  const panelRef = useRef(null);
  useEffect(() => {
    const m = /[#&]state=([A-Za-z]+)/.exec(window.location.hash || "");
    if (m && CAPITALS[m[1]]) setSelected(m[1]);
  }, []);
  // 같은 나라를 다시 누르면 닫힘. 지구본에서 고르면 상세가 화면 밖일 때만 살짝 내려 보여 준다.
  const select = useCallback((code, fromGlobe = false) => {
    setSelected((p) => (p === code ? null : code));
    if (fromGlobe && panelRef.current) {
      const top = panelRef.current.getBoundingClientRect().top;
      if (top > window.innerHeight - 160) {
        window.scrollTo({ top: window.scrollY + top - window.innerHeight * 0.35, behavior: "smooth" });
      }
    }
  }, []);
  const onGlobeSelect = useCallback((code) => select(code, true), [select]);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" /> LIVE · GLOBAL MARKETS &amp; NEWS
          </div>
          {/* h1 은 pages/index.jsx 의 화면 밖 제목(.sr-only)이 맡음 → 히어로 제목은 h2(.hero-title 스타일 동일) */}
          <h2 className="hero-title">
            세계의 흐름을
            <br />
            <span className="grad-text">한 화면에서</span>
          </h2>
          <p className="hero-sub">
            {TRACKED}개국 뉴스를 매일 요약하고, 나라 사이의 긴장과 협력을 지구본 위에 그립니다. 환율·지수·원자재·코인 시세와 자동매매 성적까지 함께 봅니다.
          </p>
          <div className="hero-clock">
            <b>{now.time}</b>
            <span>{now.date}</span>
          </div>
          <div className="hero-cta">
            <Link href="/archive" className="btn btn-primary">뉴스 아카이브 →</Link>
            <Link href="/verified" className="btn btn-ghost">검증 기록</Link>
          </div>
          <div className="hero-stats">
            <div><b>{TRACKED}</b><span>추적 국가</span></div>
            <div><b style={{ color: relColor(3) }}>{friendly}</b><span>우호 관계</span></div>
            <div><b style={{ color: relColor(-3) }}>{tense}</b><span>긴장 관계</span></div>
          </div>
        </div>

        <div className="hero-visual">
          <HeroGlobe countries={countries} relations={relations} height={isMobile ? 360 : 560}
            selected={selected} onSelect={onGlobeSelect} />
          <div className="globe-legend">
            {REL_SCALE.map((r) => (
              <span key={r.key} style={{ color: r.color }}>
                <i className={r.dash ? "dash" : ""} style={{ background: r.dash ? undefined : r.color }} />
                <em style={{ fontStyle: "normal", color: "var(--text-2)", width: "auto" }}>{r.label}</em>
              </span>
            ))}
            <em>{live ? `세계정세 ${fmtUpdated(updatedAt)} 기준` : "예시 데이터"} · 드래그로 회전 · 나라를 누르면 상세</em>
          </div>
        </div>
      </section>

      <div className="wstate reveal" ref={panelRef} id="world-state">
        <WorldStatePanel data={data} updatedAt={updatedAt} live={live} selected={selected} onSelect={select} />
      </div>
    </>
  );
}
