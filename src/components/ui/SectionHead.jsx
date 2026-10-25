// 섹션 제목 — 킥커(작은 영문 라벨) + 제목 + 설명 (+ 오른쪽 보조 요소).
// 홈뿐 아니라 모든 페이지의 큰 묶음 제목은 이걸 쓴다 (스타일: globals.css .section-head).
import React from "react";

export default function SectionHead({ kicker, title, desc, aside, id }) {
  return (
    <div className="section-head reveal" id={id}>
      <div>
        {kicker && <div className="kicker">{kicker}</div>}
        <h2>{title}</h2>
        {desc && <p>{desc}</p>}
      </div>
      {aside && <div className="section-aside">{aside}</div>}
    </div>
  );
}
