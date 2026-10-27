// 홈 — 히어로(3D 지구본) 아래 섹션들. 모든 섹션 = <SectionHead> + <Panel> 계열 (2026-10-25 통일, docs/DESIGN.md)
import React from "react";
import { useYoutubeData } from "../hooks/useYoutubeData";

import VideoCard from "../components/VideoCard";
import CalendarComponent from "../components/CalendarComponent";
import WorldRelationMap from "../components/home/WorldRelationMap";
import GlobalBriefingCard from "../components/home/GlobalBriefingCard";
import HomeHero from "../components/home/HomeHero";
import SectionHead from "../components/ui/SectionHead";
import { newsParams } from "../constants/newsMeta";

function Home() {
  const youtubeData = useYoutubeData();
  const { order } = newsParams;

  return (
    <div style={{ color: "var(--text)" }}>
      {/* 3D 지구본 히어로 */}
      <HomeHero />

      <div className="home-wrap">
        {/* 전일 글로벌 브리핑 — 각국 보도 종합 핵심 5선 */}
        <SectionHead kicker="DAILY BRIEFING" title="어제 세계에서 일어난 일" desc="10개국 보도를 종합해 뽑은 핵심 뉴스" />
        <div className="reveal" style={{ padding: "0 8px" }}>
          <GlobalBriefingCard briefing={youtubeData?.global_briefing} />
        </div>

        {/* 세계 정세 현황판 */}
        <SectionHead kicker="WORLD STATE" title="세계 정세 현황판" desc="나라별 분위기와 관계를 뉴스 근거와 함께 — 나라를 누르면 상세" />
        <div className="reveal" style={{ padding: "0 8px" }}>
          <WorldRelationMap />
        </div>

        {/* 나라별 뉴스 카드 */}
        <SectionHead kicker="COUNTRY NEWS" title="나라별 뉴스 요약" desc="각국 대표 뉴스 채널을 매일 요약합니다" />
        {youtubeData ? (
          <div className="card-grid">
            {order.map((country) => {
              const video = youtubeData[country];
              if (!video) return null;
              return (
                <div key={country} className="reveal tilt">
                  <VideoCard country={country} video={video} />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="meta" style={{ textAlign: "center" }}>불러오는 중…</p>
        )}

        {/* 휴장일 */}
        <SectionHead kicker="CALENDAR" title="국제 공휴일 캘린더" desc="7개국 시장 휴장일을 2주 앞서 확인하세요" />
        <div className="reveal" style={{ padding: "0 8px" }}>
          <CalendarComponent />
        </div>
      </div>
    </div>
  );
}

export default Home;
