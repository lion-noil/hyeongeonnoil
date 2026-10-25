# 현건노일 디자인 시스템 (3D 웹 통일 가이드)

2026-09-28 "딥 스페이스 + 유리 패널" 리디자인을 전 페이지로 넓히기 위한 규칙. 홈은 2026-10-25에 이 규칙으로 통일됐고, 다른 페이지를 옮길 때도 같은 부품만 쓴다.

## 파일 지도

| 역할 | 위치 | 비고 |
|---|---|---|
| 색·간격·폰트 토큰 | `src/styles/globals.css` `:root` + `src/styles/system.css` `:root` | 배경·내비·히어로는 globals, 의미 색(`--ok/--warn/--neg/--up/--down`)과 관계 색(`--rel-*`)은 system |
| 공용 부품 CSS | `src/styles/system.css` | `.panel*` `.badge` `.chip` `.rank` `.stat*` `.legend` `.card-grid` `.seo-summary` `.acc*` `.hol-*` `.wmap-*` |
| JS 쪽 같은 값 | `src/lib/theme.js` | SVG·three.js·인라인에서 CSS 변수를 못 쓸 때. `COLOR`, `REL_SCALE/relColor/relLabel`, `moodColor`, `categoryColor`, `COUNTRY/countryKo/countryIso` |
| 부품 컴포넌트 | `src/components/ui/` | `Panel`(+`LiveBadge` `Chip` `Rank` `StatBar`), `SectionHead`, `Flag`(+`SvgFlag`) |
| 3D | `src/components/three/` | `CosmicBackground`(전 페이지 배경), `HeroGlobe`(홈). 색은 `theme.js` 에서 가져온다 |

## 규칙 7가지

1. **hex 금지.** 컴포넌트 안에 `#xxxxxx` 를 새로 쓰지 않는다. CSS 는 `var(--…)`, JS 는 `theme.js` 의 값. 두 파일의 같은 색은 항상 같이 바꾼다(관계 팔레트가 지구본과 지도에서 달랐던 사고 방지).
2. **카드 = `<Panel>`.** 제목·메타·배지·푸터 슬롯이 있다. 카드 안에 또 제목 바를 만들지 않는다. 섹션 제목은 `<SectionHead kicker title desc>` 가 맡고, 패널 헤더엔 날짜·갱신·건수 같은 보조 정보만.
3. **국기 = `<Flag country>`** (HTML) / `<SvgFlag>` (SVG). 이모지 국기는 Windows 에서 "US" 두 글자로 깨진다. 백엔드가 주는 아이콘 문자열도 지역표시문자만이면 버린다.
4. **글자 하한.** 본문 13px(`--fs-sm`), 보조 12px(`--fs-xs`). 11px 이하는 배지 글자(대문자 라벨)에만. 흐린 색은 `--muted` 까지만 쓰고 그보다 어두운 회색을 만들지 않는다.
5. **격자.** 같은 종류 카드가 여러 장이면 `.card-grid`(auto-fill 300px) — 폭·줄 맞춤이 자동. 고정 px 폭 카드 금지.
6. **3D 감각은 부품이 낸다.** 유리 블러·윗변 하이라이트·호버 글로우(`.panel--hover`)·`.tilt`·`.reveal` 을 쓰면 된다. 섹션마다 따로 그림자·반경을 정하지 않는다.
7. **상승/하락 색**은 국내 관례(`--up` 빨강, `--down` 파랑). 긍정/부정 상태 색은 `--ok/--warn/--neg`. 둘을 섞지 않는다.

## 다른 페이지로 넓힐 때 (체크리스트)

- [ ] 페이지 최상단 서버렌더 요약은 `<SeoSummary>` (이미 `.seo-summary` 띠 스타일).
- [ ] 큰 묶음마다 `<SectionHead>`; 그 아래 모든 상자는 `<Panel>` 로 감싸기(`pad={0}` 로 차트 꽉 채우기 가능).
- [ ] 인라인 `style={{ color:"#…" }}` 를 토큰으로 치환 — `grep -n "#[0-9a-fA-F]\{3,6\}" <파일>` 로 잔여 확인.
- [ ] 작은 글자(≤11px)·어두운 회색(#3x~#6x) 제거.
- [ ] 국기/나라 이름은 `theme.js` 의 `COUNTRY` 로.
- [ ] 로컬 확인: `npx next build && npx next start -p 3123` → Chrome 헤드리스 `--headless=new --screenshot` 로 캡처(Playwright 없음).

## 왜 이렇게 두었나

- CSS 토큰과 `theme.js` 를 둘 다 두는 이유: three.js 셰이더·SVG 속성·`lightweight-charts` 옵션은 CSS 변수를 못 읽는다.
- `system.css` 를 `globals.css` 와 분리한 이유: globals 는 배경·내비·히어로처럼 레이아웃 전용, system 은 재사용 부품. 부품을 늘릴 땐 system 에만 추가한다.
