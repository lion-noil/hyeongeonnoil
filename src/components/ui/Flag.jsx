// 국기 — 이모지 대신 SVG 이미지(public/flags/{iso}.svg, flagcdn 공개 도메인).
// Windows 는 국기 이모지 글리프가 없어 "US" 두 글자로 깨지므로 사이트 전체가 이 컴포넌트를 쓴다.
// 내부 키("Korea")·ISO("KR") 둘 다 받는다. 비율이 나라마다 달라 3:2 둥근 사각형에 cover 로 맞춘다.
import React from "react";
import { countryIso, countryKo } from "../../lib/theme";

export const flagSrc = (country) => `/flags/${(countryIso(country) || "us").toLowerCase()}.svg`;

export default function Flag({ country, w = 24, style, className }) {
  const h = Math.round((w * 2) / 3);
  return (
    <img
      src={flagSrc(country)}
      alt={`${countryKo(country)} 국기`}
      width={w}
      height={h}
      draggable={false}
      className={className}
      style={{
        width: w, height: h, objectFit: "cover", flex: "none", display: "block",
        borderRadius: Math.max(2, Math.round(w / 12)),
        boxShadow: "0 0 0 1px rgba(255,255,255,0.18), 0 2px 8px -2px rgba(0,0,0,0.6)",
        ...style,
      }}
    />
  );
}

// SVG 안에서 쓰는 국기 (중심 기준, w×h 둥근 클립). id 는 같은 SVG 안에서 유일해야 한다.
export function SvgFlag({ country, w = 36, h = 24, id }) {
  const clip = `flagclip-${id || countryIso(country)}`;
  return (
    <g style={{ pointerEvents: "none" }}>
      <clipPath id={clip}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} />
      </clipPath>
      <image href={flagSrc(country)} x={-w / 2} y={-h / 2} width={w} height={h}
        preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clip})`} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill="none"
        stroke="rgba(255,255,255,0.22)" strokeWidth="0.75" />
    </g>
  );
}
