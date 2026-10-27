// src/components/home/WorldStatePanel.jsx
// 세계 정세 패널 — 히어로 3D 지구본과 한 몸 (2026-10-27 통합, 종전 2D 'WorldRelationMap' 대체).
//   지구본 = 관계를 공간으로 보여 주는 곳, 이 패널 = 나라 고르기(국기 칩) + 주목할 관계 + 선택국 상세(점수 근거·현안·관계·출처).
//   선택 상태는 HomeHero 가 들고 지구본·패널이 공유한다. 데이터는 HomeHero 가 한 번 받아(useGlobeData) 넘긴다.
import React, { useEffect, useMemo, useRef } from "react";
import { isSameWeek, parseISO, format } from "date-fns";
import { ko } from "date-fns/locale";
import { useMarketHolidaysData } from "../../hooks/useCalendarData";
import Panel, { Chip, LiveBadge, StatBar } from "../ui/Panel";
import Flag from "../ui/Flag";
import { COLOR, COUNTRY, relColor, relLabel, moodColor } from "../../lib/theme";

// ── 나라 메타 — src/lib/theme.js COUNTRY 단일 소스. 칩 순서도 이 순서.
const NAMES_KR = Object.fromEntries(Object.entries(COUNTRY).map(([k, v]) => [k, v.ko]));
const H_CODE   = Object.fromEntries(Object.entries(COUNTRY).map(([k, v]) => [k, v.iso]));
// 백엔드가 분위기 아이콘(icon)으로 국기 이모지를 주는 경우가 있다 — 국기는 이미 이미지로 그리고,
// Windows 에선 "GB" 두 글자로 깨지므로 지역표시문자(U+1F1E6~1F1FF)로만 된 아이콘은 목업 아이콘으로 대체.
const RI_ONLY = /^[\u{1F1E6}-\u{1F1FF}\s]+$/u;
const moodIcon = (icon, fallback) => {
  const v = (icon ?? "").toString().trim();
  if (!v || RI_ONLY.test(v)) return fallback;
  return v;
};

// ── 목업 데이터 (실데이터가 아예 없을 때 폴백) ─────────────────────
// issues/worry/hope/score_basis 는 백엔드에선 {text,dates} 형태지만, 목업은 문자열 — 렌더 시 asClaim()이 흡수.
const MOCK_STATES = {
  USA:     { mood:"주도적", score:7, icon:"🦅", eco:7, pol:5, dip:7,
             issues:["대선 여파로 내부 정치 갈등 지속", "중국 견제 전방위 동맹 확장", "국채 한도·양극화 내부 압박"],
             worry:"중국 견제 비용 누적", hope:"동맹 결속으로 영향력 유지", score_basis:"", special_note:"" },
  UK:      { mood:"안정적", score:6, icon:"🎩", eco:5, pol:5, dip:6,
             issues:["브렉시트 후유증 경제 타격", "스코틀랜드 독립 운동 재점화", "중동 분쟁 중재 외교 역할"],
             worry:"성장 둔화 장기화", hope:"금융 허브 지위 회복", score_basis:"", special_note:"" },
  Germany: { mood:"불안한", score:4, icon:"⚡", eco:4, pol:4, dip:6,
             issues:["경기 침체 공식 진입 위기", "에너지 비용 급등·산업 타격", "우크라이나 지원 정치 부담"],
             worry:"제조업 경쟁력 하락", hope:"에너지 가격 안정화", score_basis:"", special_note:"" },
  China:   { mood:"강경한", score:5, icon:"🐉", eco:6, pol:8, dip:4,
             issues:["대만 해협 군사 긴장 고조", "미·중 무역전쟁 전선 확대", "부동산 위기·내수 침체 심화"],
             worry:"수출 규제·내수 동반 부진", hope:"내수 회복과 기술 자립", score_basis:"", special_note:"" },
  Japan:   { mood:"경계중", score:5, icon:"🛡", eco:5, pol:6, dip:5,
             issues:["방위비 역대 최대 증액", "엔화 약세 장기화", "중국 군사력 팽창 대응 강화"],
             worry:"엔저로 수입물가 부담", hope:"방위·동맹 강화로 안보 확보", score_basis:"", special_note:"" },
  India:   { mood:"도약중", score:8, icon:"🚀", eco:8, pol:6, dip:7,
             issues:["글로벌 외교 위상 급상승", "중국과 국경 분쟁 지속", "제조업 허브 본격 부상"],
             worry:"국경 분쟁 재점화", hope:"제조업 허브로 고성장", score_basis:"", special_note:"" },
  Korea:   { mood:"긴장된", score:3, icon:"⚔️", eco:6, pol:3, dip:5,
             issues:["북핵 위협 수위 최고조", "미·중 사이 외교 딜레마", "반도체 수출 규제 직격타"],
             worry:"북핵·수출규제 동시 압박", hope:"반도체 업황 회복 기대", score_basis:"", special_note:"" },
  HongKong:{ mood:"관망중", score:5, icon:"🌉", eco:5, pol:4, dip:5,
             issues:["금융 허브 지위 유지 경쟁", "본토 경제 연동 심화", "관광·소비 회복 흐름"],
             worry:"본토 경기 둔화 전이", hope:"금융·관광 허브 회복", score_basis:"", special_note:"" },
  SaudiArabia:{ mood:"분주한", score:6, icon:"🏗️", eco:6, pol:6, dip:6,
             issues:["비전 2030 대형 프로젝트 조정", "예멘·후티 안보 위협", "유가·감산 정책"],
             worry:"역내 안보 불안 장기화", hope:"투자 유치·관광 다변화", score_basis:"", special_note:"" },
  Australia:{ mood:"안정적", score:6, icon:"🦘", eco:6, pol:6, dip:6,
             issues:["주거비·생활비 부담", "중국과 교역 관계 관리", "기후·재난 대응"],
             worry:"생활비 압박 지속", hope:"자원 수출·금리 안정", score_basis:"", special_note:"" },
};

// 실데이터는 있는데 그 나라만 아직 없을 때(새로 추가된 나라 등) — 목업을 섞으면 실제 분석처럼 보이므로 '집계 중'.
const PENDING_STATE = {
  pending: true, mood:"집계 중", score:5, icon:"⏳", eco:0, pol:0, dip:0,
  issues:["다음 세계정세 분석(매일 06:55)부터 반영됩니다."],
  worry:"", hope:"", score_basis:"", special_note:"",
};

const MOCK_RELS = [
  { a:"USA", b:"UK", s: 5 }, { a:"USA", b:"Japan", s: 4 }, { a:"USA", b:"Korea", s: 4 },
  { a:"USA", b:"China", s:-3 }, { a:"UK", b:"Germany", s: 3 }, { a:"China", b:"Japan", s:-3 },
  { a:"China", b:"India", s:-2 }, { a:"Japan", b:"Korea", s: 2 }, { a:"China", b:"HongKong", s: 3 },
];

// 백엔드 응답(countries/relations) → 내부 형태로 정규화
export function normalizeStates(countries) {
  if (!countries || typeof countries !== "object") return MOCK_STATES;
  const out = {};
  Object.keys(COUNTRY).forEach((name) => {
    const c = countries[name];
    const m = MOCK_STATES[name] || PENDING_STATE;
    if (!c) { out[name] = PENDING_STATE; return; }
    out[name] = {
      mood: c.mood ?? m.mood,
      score: Number.isFinite(c.mood_score) ? c.mood_score : m.score,
      icon: moodIcon(c.icon, m.icon),
      eco: Number.isFinite(c.eco) ? c.eco : m.eco,
      pol: Number.isFinite(c.pol) ? c.pol : m.pol,
      dip: Number.isFinite(c.dip) ? c.dip : m.dip,
      score_basis: c.score_basis ?? m.score_basis,
      issues: Array.isArray(c.issues) && c.issues.length ? c.issues : m.issues,
      worry: c.worry ?? m.worry,
      hope: c.hope ?? m.hope,
      special_note: c.special_note ?? m.special_note,
    };
  });
  return out;
}

function normalizeRels(relations) {
  if (!Array.isArray(relations) || !relations.length) return MOCK_RELS;
  return relations
    .filter((r) => r && COUNTRY[r.a] && COUNTRY[r.b])
    .map((r) => ({ a: r.a, b: r.b, s: Number(r.score) || 0, label: r.label,
                   dates: Array.isArray(r.dates) ? r.dates : [] }));
}

// 근거 단위 정규화: 문자열이든 {text,dates}든 {text, dates[]} 로 통일
const asClaim = (v) =>
  v == null ? { text: "", dates: [] }
  : typeof v === "string" ? { text: v, dates: [] }
  : { text: v.text ?? "", dates: Array.isArray(v.dates) ? v.dates : [] };

const fmtClaimDate = (d) => { try { return format(parseISO(d), "M/d"); } catch { return String(d); } };
const stateColor = (s) => (s.pending ? COLOR.muted : moodColor(s.score));

// ── 근거 출처 칩 (날짜 → 원문 링크) ──────────────────────────────
function SourceChips({ dates, srcMap }) {
  if (!dates || !dates.length) return null;
  return (
    <span className="wmap-src">
      {dates.map((d, i) => {
        const src = srcMap && srcMap[d];
        return src && src.url
          ? <Chip key={i} href={src.url} title={src.title || d} color={COLOR.cyan}>🔗 {fmtClaimDate(d)}</Chip>
          : <Chip key={i} title={d}>{fmtClaimDate(d)}</Chip>;
      })}
    </span>
  );
}

// ── 선택국 상세 ──────────────────────────────────────────────────
function DetailPanel({ name, weekHols, states, rels, sources, onSelect }) {
  const s  = states[name];
  const mc = stateColor(s);
  const myRels = rels.filter(r => r.a === name || r.b === name).sort((x, y) => Math.abs(y.s) - Math.abs(x.s));
  const hols = weekHols[name] || [];
  const countrySrc = (sources && sources[name]) || {};
  const scoreBasis = asClaim(s.score_basis);
  const worry = asClaim(s.worry);
  const hope  = asClaim(s.hope);

  return (
    <div className="wmap-detail">
      {/* ── 왼쪽: 기본 정보 + 스탯 + 공휴일 ── */}
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
          <Flag country={name} w={54} />
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:18, fontWeight:800, letterSpacing:"-0.02em" }}>{NAMES_KR[name]}</div>
            <div style={{ fontSize:"var(--fs-sm)", color:mc, marginTop:2, fontWeight:600 }}>{s.icon} {s.mood}{s.pending ? "" : ` · ${s.score}/10`}</div>
          </div>
          <button type="button" className="chip wstate-close" onClick={() => onSelect(name)} aria-label="상세 닫기">✕</button>
        </div>
        {s.pending ? (
          <p className="meta" style={{ margin: "4px 0 8px" }}>새로 추가된 나라라 점수는 다음 분석부터 나옵니다.</p>
        ) : (
          <>
            <StatBar label="💰 경제" val={s.eco} color={moodColor(s.eco)} />
            <StatBar label="🏛 정치" val={s.pol} color={moodColor(s.pol)} />
            <StatBar label="🌐 외교" val={s.dip} color={moodColor(s.dip)} />
          </>
        )}

        {scoreBasis.text && (
          <div className="wmap-box inset">
            <h4>📊 점수 근거</h4>
            <p>{scoreBasis.text}</p>
            <SourceChips dates={scoreBasis.dates} srcMap={countrySrc} />
          </div>
        )}

        <div className="wmap-box inset">
          <h4>🗓 이번 주 공휴일</h4>
          {hols.length === 0
            ? <p className="meta">공휴일 없음</p>
            : hols.map((h, i) => (
              <p key={i} style={{ color:"var(--warn)" }}>
                ✦ {h.name} <span className="meta">({format(parseISO(h.date), "M/d(E)", { locale:ko })})</span>
              </p>
            ))}
        </div>

        {s.special_note && String(s.special_note).trim() && (
          <div className="wmap-box inset note">
            <h4>💬 특이사항</h4>
            <p>{s.special_note}</p>
          </div>
        )}
      </div>

      {/* ── 가운데: 걱정/기대 + 주요 현안 ── */}
      <div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
          <div className="wmap-box inset worry">
            <h4>😟 걱정</h4>
            <p>{worry.text}</p>
            <SourceChips dates={worry.dates} srcMap={countrySrc} />
          </div>
          <div className="wmap-box inset hope">
            <h4>✨ 기대</h4>
            <p>{hope.text}</p>
            <SourceChips dates={hope.dates} srcMap={countrySrc} />
          </div>
        </div>
        <h4 className="meta" style={{ margin:"0 0 8px", fontWeight:700, letterSpacing:".06em" }}>📋 주요 현안</h4>
        {s.issues.map((issue, i) => {
          const it = asClaim(issue);
          return (
            <div key={i} className="wmap-issue inset" style={{ borderLeft:`3px solid ${mc}` }}>
              <span className="meta" style={{ fontFamily:"var(--mono)", flex:"none" }}>0{i + 1}</span>
              <span style={{ minWidth:0 }}>
                {it.text}
                {it.dates.length > 0 && <div><SourceChips dates={it.dates} srcMap={countrySrc} /></div>}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── 오른쪽: 대외 관계 (누르면 그 나라로 이동) ── */}
      <div>
        <h4 className="meta" style={{ margin:"0 0 8px", fontWeight:700, letterSpacing:".06em" }}>🌐 대외 관계</h4>
        {myRels.length === 0 && <p className="meta">이번 분석에서 잡힌 관계가 없습니다.</p>}
        {myRels.map((r, i) => {
          const other = r.a === name ? r.b : r.a;
          const relSrc = { ...((sources && sources[other]) || {}), ...countrySrc };
          return (
            <div key={i} className="wmap-rel inset">
              <button type="button" className="wstate-link" onClick={() => onSelect(other)} title={`${NAMES_KR[other]} 상세`}>
                <Flag country={other} w={26} />
                <span>{NAMES_KR[other]}</span>
              </button>
              <span className="lab" style={{ color:relColor(r.s) }}>{r.label || relLabel(r.s)} <b style={{ fontFamily:"var(--mono)" }}>{r.s > 0 ? `+${r.s}` : r.s}</b></span>
              {r.dates && r.dates.length > 0 && (
                <div style={{ flexBasis:"100%" }}><SourceChips dates={r.dates} srcMap={relSrc} /></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 메인: 국기 칩 줄 + (선택 없을 때) 주목할 관계 / (선택 시) 상세 ──
export default function WorldStatePanel({ data, updatedAt, live, selected, onSelect }) {
  const { holidaysData } = useMarketHolidaysData();
  // 폰에선 칩 줄이 가로 스크롤 — 지구본·딥링크로 고른 나라 칩이 줄 밖이면 줄 안에서만 끌어온다(페이지는 안 움직임)
  const stripRef = useRef(null);
  useEffect(() => {
    const strip = stripRef.current;
    const on = strip && strip.querySelector(".cbtn.is-on");
    if (!on || strip.scrollWidth <= strip.clientWidth) return;
    const left = on.offsetLeft - (strip.clientWidth - on.offsetWidth) / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [selected]);
  const isLive = !!(live && data && data.countries);
  const states  = useMemo(() => normalizeStates(isLive ? data.countries : null), [isLive, data]);
  const rels    = useMemo(() => normalizeRels(isLive ? data.relations : null), [isLive, data]);
  const sources = (isLive && data.sources) || {};   // {country: {date: {url,title}}}

  // 이번 주 공휴일 나라별
  const weekHols = useMemo(() => {
    const now = new Date();
    const result = {};
    Object.keys(COUNTRY).forEach((country) => {
      const hols = holidaysData?.holidays?.[H_CODE[country]];
      result[country] = (Array.isArray(hols) ? hols : []).filter((h) => {
        try { return isSameWeek(parseISO(h.date), now, { weekStartsOn: 1 }); }
        catch { return false; }
      });
    });
    return result;
  }, [holidaysData]);

  // 주목할 관계 — 점수 절대값 큰 순(긴장·적대가 동점이면 먼저) 6개
  const topRels = useMemo(
    () => [...rels].sort((x, y) => Math.abs(y.s) - Math.abs(x.s) || x.s - y.s).slice(0, 6),
    [rels]
  );

  const updatedLabel = (() => { try { return isLive && updatedAt ? `${format(parseISO(updatedAt), "M/d HH:mm")} 기준` : ""; } catch { return ""; } })();

  return (
    <Panel
      icon="🌍"
      title="세계 정세"
      meta={["뉴스 AI 분석", updatedLabel].filter(Boolean).join(" · ")}
      badge={<LiveBadge live={isLive} offText="예시 데이터" />}
      pad={0}
      hover={false}
      footer={<span className="meta">지구본의 나라·이름표나 아래 국기를 누르면 분위기·현안·관계를 뉴스 근거와 함께 봅니다 · 🗓 = 이번 주 공휴일</span>}
    >
      <div className="cstrip" role="tablist" aria-label="나라 선택" ref={stripRef}>
        {Object.keys(COUNTRY).map((name) => {
          const s = states[name];
          const mc = stateColor(s);
          const on = selected === name;
          return (
            <button key={name} type="button" role="tab" aria-selected={on}
              className={`cbtn${on ? " is-on" : ""}`} style={on ? { borderColor: mc, boxShadow: `0 0 0 1px ${mc} inset, 0 0 18px -6px ${mc}` } : undefined}
              onClick={() => onSelect(name)}>
              <Flag country={name} w={30} />
              <span className="txt">
                <span className="nm">{NAMES_KR[name]}{(weekHols[name] || []).length > 0 && <span title="이번 주 공휴일"> 🗓</span>}</span>
                <span className="md" style={{ color: mc }}>{s.icon} {s.mood}</span>
              </span>
              <span className="sc" style={{ color: mc }}>{s.pending ? "–" : s.score}</span>
            </button>
          );
        })}
      </div>

      {selected && states[selected] ? (
        <DetailPanel name={selected} weekHols={weekHols} states={states} rels={rels} sources={sources} onSelect={onSelect} />
      ) : (
        <div className="relrow">
          <span className="meta" style={{ flex: "none" }}>주목할 관계</span>
          {topRels.map((r, i) => (
            <button key={i} type="button" className="relchip" onClick={() => onSelect(r.a)} title={`${NAMES_KR[r.a]} 상세 보기`}>
              <Flag country={r.a} w={18} /><span>{NAMES_KR[r.a]}</span>
              <span className="meta">↔</span>
              <Flag country={r.b} w={18} /><span>{NAMES_KR[r.b]}</span>
              <b style={{ color: relColor(r.s) }}>{r.s > 0 ? `+${r.s}` : r.s}</b>
              {r.label && <span className="meta">{r.label}</span>}
            </button>
          ))}
        </div>
      )}
    </Panel>
  );
}
