// 공통 레이아웃 — 2026-09-28 3D 리디자인: 고정 유리 내비 + 전 페이지 3D 우주 배경 + 새 푸터.
// ?embed=1(앱 WebView 임베드)은 예전처럼 본문만, 3D 배경 없음.
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useCurrentTime } from "../hooks/useCurrentTime";

const CosmicBackground = dynamic(() => import("./three/CosmicBackground"), { ssr: false });

const navItems = [
  { path: "/", label: "홈" },
  { path: "/briefing", label: "시장 브리핑" },
  { path: "/exchange", label: "환율·채권" },
  { path: "/indexes", label: "지수" },
  { path: "/commodity", label: "원자재" },
  { path: "/coin", label: "코인" },
  { path: "/cfd", label: "CFD" },
  { path: "/archive", label: "아카이브" },
  { path: "/reports", label: "보고서" },
  { path: "/updates", label: "업데이트" },
  { path: "/others", label: "기타" },
];

const isActivePath = (pathname, path) => (path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`));

function TopBar() {
  const { pathname } = useRouter();
  const now = useCurrentTime();
  const navRef = useRef(null);

  // 모바일 가로 스크롤 내비: 현재 탭이 보이도록
  useEffect(() => {
    const el = navRef.current?.querySelector(".is-active");
    el?.scrollIntoView?.({ block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="brand" aria-label="현건노일 NewsInsight 홈">
          <span className="brand-mark" />
          <span>
            <b>NewsInsight</b>
            <small>HYEONGEON NOIL</small>
          </span>
        </Link>
        <nav className="nav" ref={navRef}>
          {navItems.map(({ path, label }) => (
            <Link key={path} href={path} className={isActivePath(pathname, path) ? "is-active" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="topbar-clock" style={pathname === "/" ? { visibility: "hidden" } : undefined} suppressHydrationWarning>
          <b suppressHydrationWarning>{now.time}</b>
          <span suppressHydrationWarning>{now.date}</span>
        </div>
      </div>
    </header>
  );
}

// 크롤러 평문 매칭 회피용 조합
const CONTACT_EMAIL = ["kiolswqa0987", "gmail.com"].join("@");

// 스크롤 등장 효과 — .reveal 요소가 화면에 들어오면 .is-in
function useRevealObserver(dep) {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("is-in"), io.unobserve(e.target))),
      { threshold: 0.08 }
    );
    const scan = () => document.querySelectorAll(".reveal:not(.is-in)").forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [dep]);
}

// 3D 기울기 — .tilt 카드가 마우스 위치에 따라 살짝 기울어짐(마우스 환경만)
function useTiltCards() {
  useEffect(() => {
    if (!window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    let last = null;
    const reset = (el) => { if (el) el.style.transform = ""; };
    const onMove = (e) => {
      const el = e.target.closest?.(".tilt");
      if (el !== last) { reset(last); last = el; }
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(1100px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateZ(0)`;
    };
    const onLeave = () => { reset(last); last = null; };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => { document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerleave", onLeave); };
  }, []);
}

export default function SiteLayout({ children }) {
  const { query, pathname } = useRouter();
  useRevealObserver(pathname);
  useTiltCards();

  // 앱 WebView 임베드(?embed=1): 내비·헤더·푸터·3D 없이 본문만 (보고서 상세 등)
  if (String(query?.embed || "") === "1") {
    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)" }}>
        <main style={{ padding: 0 }}>{children}</main>
      </div>
    );
  }

  return (
    <>
      <CosmicBackground />
      <div className="site-shell">
        <TopBar />
        <main className="site-main">{children}</main>
        <footer className="site-footer">
          <div className="site-footer-inner">
            <div>
              <div style={{ color: "var(--text-2)", fontWeight: 700 }}>현건노일 NewsInsight</div>
              <div>개인 운영 트레이딩 · 뉴스 대시보드입니다.</div>
              <div>
                비즈니스 · 제휴 및 기타 문의:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </div>
            </div>
            <div className="foot-links">
              <Link href="/briefing">시장 브리핑</Link>
              <Link href="/archive">뉴스 아카이브</Link>
              <Link href="/reports">보고서</Link>
              <Link href="/privacy">개인정보처리방침</Link>
              <a href="/rss.xml">RSS</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
