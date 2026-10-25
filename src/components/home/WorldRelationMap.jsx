// src/components/home/WorldRelationMap.jsx
import React, { useState, useMemo, useEffect } from "react";
import { isSameWeek, parseISO, format } from "date-fns";
import { ko } from "date-fns/locale";
import { useMarketHolidaysData } from "../../hooks/useCalendarData";
import { useWorldStateData } from "../../hooks/useWorldStateData";
import Panel, { Chip, LiveBadge, StatBar } from "../ui/Panel";
import Flag, { SvgFlag } from "../ui/Flag";
import { COLOR, COUNTRY, REL_SCALE, relColor, relLabel, moodColor } from "../../lib/theme";

// ── 레이아웃 상수 ──────────────────────────────────────────────────
const VW = 900, VH = 490, R = 36;

// ── 나라 메타 — src/lib/theme.js COUNTRY 단일 소스 (한글명·ISO). 국기는 <Flag>/<SvgFlag> (이모지 금지)
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

// SVG viewBox 상의 노드 중심 좌표
const NODES = {
  USA:     { cx:  90, cy: 238 },
  UK:      { cx: 302, cy: 128 },
  Germany: { cx: 418, cy: 128 },
  China:   { cx: 592, cy: 222 },
  Japan:   { cx: 750, cy: 142 },
  India:   { cx: 598, cy: 352 },
  Korea:   { cx: 745, cy: 285 },
  HongKong:{ cx: 660, cy: 300 },
};

// ── 목업 데이터 (실데이터 없을 때 폴백) ────────────────────────────
// issues/worry/hope/score_basis 는 백엔드에선 {text,dates} 형태지만,
// 폴백 목업은 문자열로 둬도 렌더 시 asClaim()이 흡수한다.
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
};

const MOCK_RELS = [
  { a:"USA",     b:"UK",      s: 5 },
  { a:"USA",     b:"Germany", s: 4 },
  { a:"USA",     b:"Japan",   s: 4 },
  { a:"USA",     b:"Korea",   s: 4 },
  { a:"USA",     b:"India",   s: 3 },
  { a:"USA",     b:"China",   s:-3 },
  { a:"UK",      b:"Germany", s: 3 },
  { a:"China",   b:"Japan",   s:-3 },
  { a:"China",   b:"India",   s:-2 },
  { a:"China",   b:"Korea",   s:-1 },
  { a:"Japan",   b:"Korea",   s: 2 },
  { a:"India",   b:"Korea",   s: 2 },
  { a:"Germany", b:"India",   s: 2 },
  { a:"China",   b:"HongKong", s: 3 },
];

// 백엔드 응답(countries/relations) → 컴포넌트 내부 형태로 정규화
function normalizeStates(countries) {
  if (!countries || typeof countries !== "object") return MOCK_STATES;
  const out = {};
  Object.keys(MOCK_STATES).forEach((name) => {
    const c = countries[name];
    if (!c) { out[name] = MOCK_STATES[name]; return; }
    out[name] = {
      mood: c.mood ?? MOCK_STATES[name].mood,
      score: Number.isFinite(c.mood_score) ? c.mood_score : MOCK_STATES[name].score,
      icon: moodIcon(c.icon, MOCK_STATES[name].icon),
      eco: Number.isFinite(c.eco) ? c.eco : MOCK_STATES[name].eco,
      pol: Number.isFinite(c.pol) ? c.pol : MOCK_STATES[name].pol,
      dip: Number.isFinite(c.dip) ? c.dip : MOCK_STATES[name].dip,
      score_basis: c.score_basis ?? MOCK_STATES[name].score_basis,
      issues: Array.isArray(c.issues) && c.issues.length ? c.issues : MOCK_STATES[name].issues,
      worry: c.worry ?? MOCK_STATES[name].worry,
      hope: c.hope ?? MOCK_STATES[name].hope,
      special_note: c.special_note ?? MOCK_STATES[name].special_note,
    };
  });
  return out;
}

function normalizeRels(relations) {
  if (!Array.isArray(relations) || !relations.length) return MOCK_RELS;
  return relations
    .filter((r) => r && NODES[r.a] && NODES[r.b])
    .map((r) => ({ a: r.a, b: r.b, s: Number(r.score) || 0, label: r.label,
                   dates: Array.isArray(r.dates) ? r.dates : [] }));
}

// 근거 단위 정규화: 문자열이든 {text,dates}든 {text, dates[]} 로 통일
const asClaim = (v) =>
  v == null ? { text: "", dates: [] }
  : typeof v === "string" ? { text: v, dates: [] }
  : { text: v.text ?? "", dates: Array.isArray(v.dates) ? v.dates : [] };

// 근거 날짜 표시
const fmtClaimDate = (d) => { try { return format(parseISO(d), "M/d"); } catch { return String(d); } };

// ── 색 — src/lib/theme.js (히어로 지구본과 같은 관계·분위기 팔레트) ──
const NODE_FILL = "rgba(9, 14, 26, 0.96)";
const NODE_FILL_SEL = "rgba(20, 32, 58, 0.98)";

// 두 노드 사이 선의 시작점 (원 테두리에서 출발)
function edgePt(from, to) {
  const dx = to.cx - from.cx, dy = to.cy - from.cy;
  const d = Math.sqrt(dx * dx + dy * dy) || 1;
  return [from.cx + (dx / d) * (R + 3), from.cy + (dy / d) * (R + 3)];
}

// ── SVG: 관계선 ────────────────────────────────────────────────────
function RelLine({ rel, mode }) {
  const na = NODES[rel.a], nb = NODES[rel.b];
  const [ax, ay] = edgePt(na, nb);
  const [bx, by] = edgePt(nb, na);
  const color = relColor(rel.s);
  const abs   = Math.abs(rel.s);
  const dash  = rel.s < 0 ? "5 3" : undefined;
  const mx    = (ax + bx) / 2, my = (ay + by) / 2;

  if (mode === "dimmed") {
    return <line x1={ax} y1={ay} x2={bx} y2={by}
      stroke={color} strokeWidth={abs * 0.5} strokeOpacity={0.06} strokeDasharray={dash} />;
  }
  if (mode === "normal") {
    return (
      <g>
        <line x1={ax} y1={ay} x2={bx} y2={by}
          stroke={color} strokeWidth={abs * 1.5} strokeOpacity={0.09} />
        <line x1={ax} y1={ay} x2={bx} y2={by}
          stroke={color} strokeWidth={abs * 0.7} strokeOpacity={0.28} strokeDasharray={dash} />
      </g>
    );
  }
  // highlighted — 노드 위 레이어에 그림
  return (
    <g>
      <line x1={ax} y1={ay} x2={bx} y2={by}
        stroke={color} strokeWidth={abs * 3.5} strokeOpacity={0.22} />
      <line x1={ax} y1={ay} x2={bx} y2={by}
        stroke={color} strokeWidth={abs * 1.4} strokeOpacity={0.95} strokeDasharray={dash} />
      <rect x={mx - 30} y={my - 11} width={60} height={20} rx={5}
        fill={COLOR.panelSolid} stroke={color} strokeWidth={0.8} strokeOpacity={0.8} />
      <text x={mx} y={my + 1}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={9} fill={color} style={{ pointerEvents:"none", userSelect:"none" }}>
        {rel.label || relLabel(rel.s)}
      </text>
    </g>
  );
}

// ── SVG: 나라 노드 ─────────────────────────────────────────────────
function CountryNode({ name, state, selected, dimmed, connected, onClick, hasHoliday }) {
  const n  = NODES[name];
  const s  = state;
  const mc = moodColor(s.score);

  return (
    <g
      transform={`translate(${n.cx},${n.cy})`}
      onClick={() => onClick(name)}
      style={{ cursor:"pointer", opacity: dimmed ? 0.3 : 1, transition:"opacity 0.25s" }}
    >
      {/* 외부 글로우 링 (선택 시) */}
      {selected && (
        <circle r={R + 11} fill="none" stroke={mc} strokeWidth="1.5" strokeOpacity="0.3" />
      )}
      {/* 연결된 나라 표시 (연한 링) */}
      {connected && !selected && (
        <circle r={R + 6} fill="none" stroke={mc} strokeWidth="1" strokeOpacity="0.18" />
      )}
      {/* 메인 원 */}
      <circle r={R}
        fill={selected ? NODE_FILL_SEL : NODE_FILL}
        stroke={mc}
        strokeWidth={selected ? 2.5 : 1.5}
      />
      {/* 국기 (SVG 이미지, 둥근 사각형 클립) */}
      <g transform="translate(0,-1)"><SvgFlag country={name} w={36} h={24} id={`wmap-${name}`} /></g>
      {/* 나라 이름 */}
      <text y={R + 16} fontSize="12" fontWeight="bold"
        fill={selected ? "#ffffff" : COLOR.text}
        textAnchor="middle" style={{ userSelect:"none" }}>
        {NAMES_KR[name]}
      </text>
      {/* 상태 문구 */}
      <text y={R + 29} fontSize="10" fontWeight="600" fill={mc}
        textAnchor="middle" style={{ userSelect:"none" }}>
        {s.icon} {s.mood}
      </text>
      {/* 공휴일 배지 */}
      {hasHoliday && (
        <g transform={`translate(${R - 3},${-(R - 3)})`}>
          <circle r={9} fill={COLOR.warn} stroke={COLOR.panelSolid} strokeWidth="1.5" />
          <text fontSize="11" textAnchor="middle" dominantBaseline="middle"
            style={{ userSelect:"none" }}>🗓</text>
        </g>
      )}
    </g>
  );
}

// ── HTML: 근거 출처 칩 (날짜 → 원문 링크) ──────────────────────────
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

// ── HTML: 상세 패널 ────────────────────────────────────────────────
function DetailPanel({ name, weekHols, states, rels, sources }) {
  const s  = states[name];
  const mc = moodColor(s.score);
  const myRels = rels.filter(r => r.a === name || r.b === name);
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
          <div>
            <div style={{ fontSize:18, fontWeight:800, letterSpacing:"-0.02em" }}>{NAMES_KR[name]}</div>
            <div style={{ fontSize:"var(--fs-sm)", color:mc, marginTop:2, fontWeight:600 }}>{s.icon} {s.mood} · {s.score}/10</div>
          </div>
        </div>
        <StatBar label="💰 경제" val={s.eco} color={moodColor(s.eco)} />
        <StatBar label="🏛 정치" val={s.pol} color={moodColor(s.pol)} />
        <StatBar label="🌐 외교" val={s.dip} color={moodColor(s.dip)} />

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

      {/* ── 오른쪽: 대외 관계 ── */}
      <div>
        <h4 className="meta" style={{ margin:"0 0 8px", fontWeight:700, letterSpacing:".06em" }}>🌐 대외 관계</h4>
        {myRels.map((r, i) => {
          const other = r.a === name ? r.b : r.a;
          const relSrc = { ...((sources && sources[other]) || {}), ...countrySrc };
          return (
            <div key={i} className="wmap-rel inset">
              <Flag country={other} w={26} />
              <span>{NAMES_KR[other]}</span>
              <span className="lab" style={{ color:relColor(r.s) }}>{r.label || relLabel(r.s)}</span>
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

// ── 메인 컴포넌트 ──────────────────────────────────────────────────
export default function WorldRelationMap() {
  const [selected, setSelected] = useState(null);
  // 딥링크: /#state=Korea 로 열면 그 나라가 선택된 채 시작 (공유·점검용)
  useEffect(() => {
    const m = /[#&]state=([A-Za-z]+)/.exec(window.location.hash || "");
    if (m && NODES[m[1]]) setSelected(m[1]);
  }, []);
  const { holidaysData } = useMarketHolidaysData();
  const { data: worldData, updatedAt } = useWorldStateData();

  const isLive = !!(worldData && worldData.countries);

  // 실데이터 우선, 없으면 목업 폴백
  const states = useMemo(() => normalizeStates(worldData?.countries), [worldData]);
  const rels   = useMemo(() => normalizeRels(worldData?.relations), [worldData]);
  const sources = worldData?.sources || {};   // {country: {date: {url,title}}}

  // 이번 주 공휴일 나라별로 분류
  const weekHols = useMemo(() => {
    const now = new Date();
    const result = {};
    Object.keys(NODES).forEach((country) => {
      const code = H_CODE[country];
      const hols = holidaysData?.holidays?.[code] || [];
      result[country] = hols.filter((h) => {
        try { return isSameWeek(parseISO(h.date), now, { weekStartsOn: 1 }); }
        catch { return false; }
      });
    });
    return result;
  }, [holidaysData]);

  // 선택된 나라와 연결된 나라들
  const connectedSet = useMemo(() => {
    if (!selected) return new Set();
    return new Set(
      rels.filter((r) => r.a === selected || r.b === selected)
          .map((r) => (r.a === selected ? r.b : r.a))
    );
  }, [selected, rels]);

  const handleSelect = (name) => setSelected((p) => (p === name ? null : name));

  const updatedLabel = (() => { try { return isLive && updatedAt ? `${format(parseISO(updatedAt), "M/d HH:mm")} 기준` : ""; } catch { return ""; } })();

  return (
    <Panel
      icon="🌍"
      title="세계 정세 현황판"
      meta={["뉴스 AI 분석 기반", updatedLabel].filter(Boolean).join(" · ")}
      badge={<LiveBadge live={isLive} offText="MOCK DATA" />}
      pad={0}
      hover={false}
      footer={
        <>
          <div className="legend">
            {REL_SCALE.map((r) => (
              <span key={r.key} style={{ color: r.color }}><i className={r.dash ? "dash" : ""} /><em style={{ fontStyle:"normal", color:"var(--text-2)" }}>{r.label}</em></span>
            ))}
          </div>
          <span className="spacer" />
          <span className="meta">🗓 이번 주 공휴일 · 클릭 → 상세 보기</span>
        </>
      }
    >
      {/* SVG 맵 — viewBox로 반응형, 가로 스크롤 없음 */}
      <div style={{ lineHeight:0 }}>
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          width="100%"
          style={{ display:"block" }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="wg" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(148,163,255,0.07)" strokeWidth="0.7" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wg)" />

          {/* ── 레이어 1: 배경 관계선 (노드 아래) ── */}
          {rels.map((r, i) => {
            // 선택된 나라의 선은 레이어3에서 그림 → 여기선 스킵
            if (selected && (r.a === selected || r.b === selected)) return null;
            return (
              <RelLine key={i} rel={r} mode={selected ? "dimmed" : "normal"} />
            );
          })}

          {/* ── 레이어 2: 나라 노드 ── */}
          {Object.keys(NODES).map((name) => (
            <CountryNode
              key={name}
              name={name}
              state={states[name]}
              selected={selected === name}
              dimmed={!!selected && selected !== name && !connectedSet.has(name)}
              connected={connectedSet.has(name)}
              onClick={handleSelect}
              hasHoliday={(weekHols[name] || []).length > 0}
            />
          ))}

          {/* ── 레이어 3: 선택된 나라의 하이라이트 선 (노드 위) ── */}
          {selected && rels
            .filter((r) => r.a === selected || r.b === selected)
            .map((r, i) => <RelLine key={`hl${i}`} rel={r} mode="highlighted" />)
          }
        </svg>
      </div>

      {/* 상세 패널 */}
      {selected && <DetailPanel name={selected} weekHols={weekHols} states={states} rels={rels} sources={sources} />}

    </Panel>
  );
}

