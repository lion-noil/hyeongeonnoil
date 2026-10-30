// 시세 차트 분류 탭 — 환율·채권 / 지수 / 원자재 를 한 메뉴('시세 차트') 아래 세 분류로. (2026-10-30)
// URL(/exchange·/indexes·/commodity)은 검색 유입·사이트맵·허브 본문 때문에 그대로 두고, 탭은 그 사이를 Link 로 오간다.
import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export const CHART_CATS = [
  { path: "/exchange", label: "환율·채권", icon: "💱" },
  { path: "/indexes", label: "지수", icon: "📈" },
  { path: "/commodity", label: "원자재", icon: "⛏️" },
];
export const CHART_PATHS = CHART_CATS.map((c) => c.path);

export default function ChartCategoryTabs() {
  const { pathname } = useRouter();
  return (
    <div className="cat-tabs" role="tablist" aria-label="시세 차트 분류">
      {CHART_CATS.map((c) => {
        const on = pathname === c.path;
        return (
          <Link key={c.path} href={c.path} role="tab" aria-selected={on} className={`cat-tab${on ? " is-on" : ""}`}>
            <span aria-hidden>{c.icon}</span> {c.label}
          </Link>
        );
      })}
    </div>
  );
}
