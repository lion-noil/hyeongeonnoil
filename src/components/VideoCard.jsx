// 나라별 뉴스 카드 — 공용 <Panel> + <Flag>. (2026-10-25 통일)
import React from "react";
import { isToday } from "../utils/date";
import NewsSummary from "./common/NewsSummary";
import Panel, { Chip } from "./ui/Panel";
import Flag from "./ui/Flag";
import { countryKo } from "../lib/theme";

function timeAgo(publishedAt) {
  const uploadedAt = new Date(publishedAt); // 이미 KST
  const nowKST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const diffMinutes = Math.max(0, Math.floor((nowKST - uploadedAt) / 60000));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return hours > 0 ? `${hours}시간 ${minutes}분 전` : `${minutes}분 전`;
}

function fmtChecked(iso) {
  const date = new Date(iso);
  const o = { timeZone: "Asia/Seoul" };
  const weekday = date.toLocaleDateString("ko-KR", { ...o, weekday: "short" });
  const monthDay = date.toLocaleDateString("ko-KR", { ...o, month: "long", day: "numeric" });
  const time = date.toLocaleTimeString("ko-KR", { ...o, hour: "2-digit", minute: "2-digit", hour12: false });
  return `${monthDay} (${weekday}) ${time}`;
}

const VideoCard = ({ country, video }) => {
  const fresh = isToday(video.publishedAt);
  return (
    <Panel
      as="article"
      className="news-card"
      icon={<Flag country={country} w={30} />}
      title={countryKo(country)}
      meta={country}
      badge={<span className={`badge ${fresh ? "badge--live" : "badge--off"}`}>{fresh ? "오늘" : "이전"}</span>}
      pad={14}
    >
      <a className="news-title" href={video.url} target="_blank" rel="noopener noreferrer">
        {video.title}
      </a>
      <div className="news-meta">
        <Chip title="업로드">🕒 {timeAgo(video.publishedAt)}</Chip>
        {video.processed_time && <Chip title="요약 확인 시각">✅ {fmtChecked(video.processed_time)}</Chip>}
      </div>
      <div style={{ marginTop: 12 }}>
        <NewsSummary items={video.summary_items} summaryText={video.summary_result} />
      </div>
    </Panel>
  );
};

export default VideoCard;
