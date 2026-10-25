// 국제 공휴일 캘린더 — 앞으로 2주 띠(날짜별 휴장국 국기) + 휴장일 목록. (2026-10-25 통일: <Panel>/<Flag>/토큰)
// 데이터: /api/market-holidays { timestamp, holidays: { KR:[{date,name,description}], ... } } (7개국)
import React, { useMemo } from "react";
import { parseISO, format, addDays, isSameDay, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { useMarketHolidaysData } from "../hooks/useCalendarData";
import { countryNameMap as calendarMeta } from "../constants/calendarMeta";
import Panel, { Chip } from "./ui/Panel";
import Flag from "./ui/Flag";

const DAYS = 14;

export default function CalendarComponent() {
  const { holidaysData, loading, error } = useMarketHolidaysData();

  const view = useMemo(() => {
    if (!holidaysData?.timestamp) return null;
    const start = startOfDay(parseISO(holidaysData.timestamp));
    const today = startOfDay(new Date());
    const days = Array.from({ length: DAYS }, (_, i) => addDays(start, i));
    const byDate = {};
    const items = [];
    calendarMeta.countryList.forEach((code) => {
      (holidaysData.holidays?.[code] || []).forEach((h) => {
        const d = startOfDay(parseISO(h.date));
        (byDate[h.date] ||= []).push(code);
        items.push({ code, date: d, key: h.date, name: h.name });
      });
    });
    items.sort((a, b) => a.date - b.date || a.code.localeCompare(b.code));
    return { start, end: days[days.length - 1], today, days, byDate, items };
  }, [holidaysData]);

  const meta = view ? `${format(view.start, "M월 d일 (E)", { locale: ko })} ~ ${format(view.end, "M월 d일 (E)", { locale: ko })} · ${calendarMeta.countryList.length}개국` : "";

  return (
    <Panel icon="🗓" title="앞으로 2주 휴장일" meta={meta}
      badge={view && <Chip color="var(--warn)">{view.items.length ? `휴장 ${view.items.length}건` : "휴장 없음"}</Chip>}
      style={{ maxWidth: 960, margin: "0 auto" }} pad={16}
      footer={
        <div className="legend">
          <span style={{ color: "var(--ok)" }}><i className="dot" /><em style={{ fontStyle: "normal", color: "var(--text-2)" }}>오늘</em></span>
          <span style={{ color: "var(--warn)" }}><i className="dot" /><em style={{ fontStyle: "normal", color: "var(--text-2)" }}>휴장일 (국기 = 휴장 국가)</em></span>
        </div>
      }
    >
      {loading && <div className="meta">불러오는 중…</div>}
      {error && <div className="meta">{error}</div>}
      {!loading && !error && !view && <div className="meta">공휴일 데이터가 없습니다.</div>}
      {view && (
        <>
          <div className="hol-strip">
            {view.days.map((d) => {
              const key = format(d, "yyyy-MM-dd");
              const codes = view.byDate[key] || [];
              const dow = d.getDay();
              const cls = ["hol-day", isSameDay(d, view.today) ? "is-today" : "", codes.length ? "has-hol" : "", dow === 0 || dow === 6 ? "is-wknd" : ""].join(" ");
              return (
                <div key={key} className={cls} title={codes.length ? codes.map((c) => calendarMeta.country[c]).join(", ") + " 휴장" : undefined}>
                  <div className="dow">{format(d, "E", { locale: ko })}</div>
                  <div className="d">{format(d, "d")}</div>
                  <div className="flags">{codes.map((c) => <Flag key={c} country={c} w={14} />)}</div>
                </div>
              );
            })}
          </div>
          {view.items.length === 0 ? (
            <div className="hol-empty">앞으로 2주간 {calendarMeta.countryList.length}개국 시장 모두 휴장일이 없습니다.</div>
          ) : (
            <div className="hol-list">
              {view.items.map((it) => (
                <div key={`${it.key}-${it.code}`} className={`hol-item inset ${isSameDay(it.date, view.today) ? "is-today" : ""}`}>
                  <span className="when">{format(it.date, "M/d (E)", { locale: ko })}</span>
                  <Flag country={it.code} w={22} />
                  <span className="who">{calendarMeta.country[it.code] || it.code}</span>
                  <span className="what">{it.name}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
