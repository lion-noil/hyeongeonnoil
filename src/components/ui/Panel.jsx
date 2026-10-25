// 유리 패널 — 홈·전 페이지 카드의 공통 껍데기 (2026-10-25)
// 모든 "카드"는 이걸로 감싼다: 같은 반경·테두리·그림자·헤더 높이라서 섹션마다 생김새가 달라지지 않는다.
//   <Panel title="…" meta="…" badge={<LiveBadge live />} actions={…} footer={…} pad={0}>본문</Panel>
// 스타일은 globals.css 의 .panel* 클래스(토큰 기반). 색을 여기 하드코딩하지 않는다.
import React from "react";

export default function Panel({
  title, icon, meta, badge, actions, footer, children,
  pad = 16, hover = true, className = "", style, bodyStyle, as: Tag = "section", ...rest
}) {
  const hasHead = title || meta || badge || actions;
  return (
    <Tag className={`panel ${hover ? "panel--hover" : ""} ${className}`.trim()} style={style} {...rest}>
      {hasHead && (
        <header className="panel-head">
          <div className="panel-head-main">
            {icon && <span className="panel-icon" aria-hidden>{icon}</span>}
            {title && <h3 className="panel-title">{title}</h3>}
            {meta && <span className="panel-meta">{meta}</span>}
          </div>
          {(badge || actions) && (
            <div className="panel-head-side">
              {actions}
              {badge}
            </div>
          )}
        </header>
      )}
      <div className="panel-body" style={{ padding: pad, ...bodyStyle }}>{children}</div>
      {footer && <footer className="panel-foot">{footer}</footer>}
    </Tag>
  );
}

export function LiveBadge({ live, liveText = "LIVE", offText = "예시 데이터" }) {
  return (
    <span className={`badge ${live ? "badge--live" : "badge--off"}`}>
      {live && <i className="live-dot" />}
      {live ? liveText : offText}
    </span>
  );
}

// 작은 라벨 칩 — 카테고리·날짜·링크. color 는 테마의 의미 색을 넘긴다.
export function Chip({ color, children, href, title, style, className = "" }) {
  const s = color ? { color, borderColor: `${color}66`, background: `${color}14`, ...style } : style;
  if (href) {
    return (
      <a className={`chip ${className}`} href={href} target="_blank" rel="noreferrer" title={title} style={s}>
        {children}
      </a>
    );
  }
  return <span className={`chip ${className}`} title={title} style={s}>{children}</span>;
}

// 순위 배지(①②③…) — 브리핑·나라별 뉴스 공용
export function Rank({ n, size = 22 }) {
  return <span className="rank" style={{ width: size, height: size, fontSize: Math.round(size * 0.55) }}>{n}</span>;
}

// 0~10 점수 막대 — 세계정세 상세 등
export function StatBar({ label, val, color }) {
  return (
    <div className="stat">
      <div className="stat-row">
        <span>{label}</span>
        <b style={{ color }}>{val}/10</b>
      </div>
      <div className="stat-track">
        <div className="stat-fill" style={{ width: `${Math.max(0, Math.min(10, val)) * 10}%`, background: color, boxShadow: `0 0 8px ${color}99` }} />
      </div>
    </div>
  );
}
