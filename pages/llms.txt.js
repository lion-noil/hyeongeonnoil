// pages/llms.txt.js — AI 어시스턴트용 사이트 요약 (llms.txt 관례, smilekey-site 와 같은 형식) (2026-09-30)
//   사이트 성격 + 페이지 목록 + 최근 브리핑·뉴스 요약 링크를 평문으로 제공한다. 목록은 DB에서 자동 반영.
//   주의: 공식 표준이 아니라 관례이며 읽는 크롤러는 제한적 — 사람이 보는 페이지가 여전히 1차 자료다.
import { listBriefings } from "../src/lib/briefingDb";
import { getRecentDays } from "../src/lib/archiveDb";

const SITE_URL = "https://hyeongeonnoil.com";

const PAGES = [
  ["/", "홈", "어제 세계 핵심 뉴스 5선, 세계 정세 현황판(3D 지구본), 8개국 뉴스 방송 카드, 일정 캘린더"],
  ["/briefing", "시장 브리핑", "매일 아침 1편 — 어제 종가 시세표(환율·금리·증시·원자재·코인)와 세계 뉴스를 연결한 한 장 정리"],
  ["/archive", "뉴스 요약 아카이브", "날짜별 8개국(미국·중국·일본·인도·홍콩·한국·독일·영국) 주요 뉴스 방송 한국어 요약"],
  ["/exchange", "환율·채권", "달러 인덱스, 원·엔·위안·유로 등 주요 통화 환율과 미·일·한 국채 금리 일봉 차트(100일 이동평균·엔벨로프)"],
  ["/indexes", "세계 주가지수", "나스닥100·닛케이225·상하이A·항셍·BSE30·코스피200·유로스톡스50·DAX 일봉 차트"],
  ["/commodity", "원자재", "금·원유·천연가스·옥수수·커피·밀·생우 시세 일봉 차트"],
  ["/coin", "코인·자동매매", "비트코인 등 주요 코인 1분·일봉 차트와 Bybit 자동매매 실계좌 포지션·손익·매매 전적 공개"],
  ["/cfd", "CFD·FX", "MT5 기반 지수·귀금속·외환 CFD 차트와 자동매매 전략 시그널, 계좌 현황"],
  ["/reports", "트레이딩봇 보고서", "주간·월간 셀(계좌×심볼×전략)별 성과 보고서와 심층 분석"],
  ["/updates", "업데이트 노트", "사이트·앱·봇 변경 이력"],
];

export async function getServerSideProps({ res }) {
  let briefings = [];
  let days = [];
  try {
    briefings = await listBriefings(10);
  } catch {
    // Redis 오류 시 목록만 생략
  }
  try {
    days = await getRecentDays(10);
  } catch {
    // Supabase 오류 시 목록만 생략
  }

  const kdate = (d) => {
    const [y, m, dd] = String(d).split("-");
    return `${y}년 ${Number(m)}월 ${Number(dd)}일`;
  };

  const briefingBlock = briefings.length
    ? briefings.map((b) => `- [${b.title || `${kdate(b.day)} 시장 브리핑`}](${SITE_URL}/briefing/${b.day})`).join("\n")
    : "- (목록을 불러오지 못함) 전체 목록: " + SITE_URL + "/briefing";
  const archiveBlock = days.length
    ? days.map((d) => `- [${kdate(d.day)} 세계 뉴스 요약](${SITE_URL}/archive/${d.day})${d.countries?.length ? ` — ${d.countries.length}개국` : ""}`).join("\n")
    : "- (목록을 불러오지 못함) 전체 목록: " + SITE_URL + "/archive";

  const text = `# 현건노일 NewsInsight

> 개인이 운영하는 뉴스·시세 대시보드입니다. 매일 8개국(미국·중국·일본·인도·홍콩·한국·독일·영국) 뉴스 방송을 한국어로 요약해 날짜별로 보관하고, 매일 아침 어제 종가와 세계 뉴스를 연결한 시장 브리핑을 1편 발행합니다. 환율·채권 금리·주가지수·원자재·코인 시세 차트를 제공하며, Bybit(코인)·MT5(CFD) 자동매매 봇의 실계좌 성적과 주간·월간 보고서를 공개합니다. 나라별 분위기와 관계를 뉴스 근거와 함께 보여주는 세계정세 현황판도 있습니다.

## 페이지
${PAGES.map(([path, name, desc]) => `- [${name}](${SITE_URL}${path}): ${desc}`).join("\n")}
- 사이트맵: ${SITE_URL}/sitemap.xml
- RSS(뉴스 요약): ${SITE_URL}/rss.xml

## 최근 브리핑
${briefingBlock}

## 최근 뉴스 요약
${archiveBlock}

## 데이터 출처·주의
- 시세: 한국투자증권(KIS) API 등에서 매시 수집한 일봉 종가. 코인은 Bybit, CFD·FX는 HFM MT5 시세.
- 뉴스 요약: 각국 공개 뉴스 방송 영상을 음성 인식 후 LLM 으로 요약한 것이라 원문과 차이가 있을 수 있음. 원본 영상 링크를 함께 둡니다.
- 자동매매 성적·보고서는 운영자 개인 계좌의 기록 공개이며 과거 성과가 미래를 보장하지 않습니다.
- 이 사이트의 모든 내용은 정보 제공 목적이며 투자 권유가 아닙니다. 인용 시 날짜(기준일)를 함께 표기해 주세요.
`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.write(text);
  res.end();

  return { props: {} };
}

export default function LlmsTxt() {
  return null;
}
