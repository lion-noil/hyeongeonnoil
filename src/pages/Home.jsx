import React from "react";
import { useYoutubeData } from "../hooks/useYoutubeData";

import VideoCard from "../components/VideoCard";
import CalendarComponent from "../components/CalendarComponent";
import WorldRelationMap from "../components/home/WorldRelationMap";
import GlobalBriefingCard from "../components/home/GlobalBriefingCard";
import HomeHero from "../components/home/HomeHero";
import { newsParams } from "../constants/newsMeta";

function SectionHead({ kicker, title, desc }) {
  return (
    <div className="section-head reveal">
      <div>
        <div className="kicker">{kicker}</div>
        <h2>{title}</h2>
        {desc && <p>{desc}</p>}
      </div>
    </div>
  );
}

function Home() {
  const youtubeData = useYoutubeData();
  const { order } = newsParams;

  return (
    <div style={{ color: "var(--text)" }}>
      {/* 3D 지구본 히어로 */}
      <HomeHero />

      <div className="home-wrap">
        {/* 전일 글로벌 브리핑 — 각국 보도 종합 핵심 5선 */}
        <SectionHead kicker="DAILY BRIEFING" title="어제 세계에서 일어난 일" desc="8개국 보도를 종합해 뽑은 핵심 뉴스" />
        <div className="reveal" style={{ padding: "0 8px" }}>
          <GlobalBriefingCard briefing={youtubeData?.global_briefing} />
        </div>

        {/* 세계 정세 현황판 */}
        <SectionHead kicker="WORLD STATE" title="세계 정세 현황판" desc="나라별 분위기와 관계를 뉴스 근거와 함께" />
        <div className="reveal" style={{ padding: "0 8px" }}>
          <WorldRelationMap />
        </div>

        {/* 뉴스 카드 영역 */}
        <SectionHead kicker="COUNTRY NEWS" title="나라별 뉴스 요약" desc="각국 대표 뉴스 채널을 매일 요약합니다" />
        {youtubeData ? (
          <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap", padding: "0 8px" }}>
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
          <p style={{ textAlign: "center", color: "var(--muted)" }}>불러오는 중…</p>
        )}

        {/* 달력 */}
        <SectionHead kicker="CALENDAR" title="국제 공휴일 캘린더" desc="휴장일을 미리 확인하세요" />
        <div
          className="glass reveal"
          style={{
            padding: "20px",
            maxWidth: "420px",
            margin: "0 auto",
          }}
        >
          <CalendarComponent />
        </div>
      </div>
    </div>
  );
}

export default Home;
