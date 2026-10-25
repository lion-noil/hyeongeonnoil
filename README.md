# 코드 테스트
개발용 : npm start (로컬 백엔드씀)
배포용 : npm run build 
        npm install -g serve
        serve -s build
(서버 백엔드씀)

npx vercel dev

# 게시판 추가
1. Router.jsx 에서 아래 추가
import Archive from "../pages/Archive";

<Route path="/usstock" element={<UsStock />} />

{ path: "/archive", label: "아카이브", emoji: "🗂️" },

2. pages에 페이지 jsx 추가
3. 
## 디자인 시스템

전 페이지를 "딥 스페이스 + 유리 패널(3D 웹)" 스타일로 통일하는 규칙과 부품은 [docs/DESIGN.md](docs/DESIGN.md) 를 따른다.
토큰은 `src/styles/globals.css`·`src/styles/system.css`, JS 쪽 같은 값은 `src/lib/theme.js`, 부품은 `src/components/ui/`(Panel·SectionHead·Flag).
