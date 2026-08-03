"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { useAttendanceRange } from "@/hooks/useAttendanceRange";
import {
  buildWeeks,
  computeStats,
  ymd,
  startOfMonth,
  endOfMonth,
  addMonths,
  WEEKDAY_LABELS,
  type DayInfo,
} from "@/utils/attendanceHeatmap";

const RANGE_OPTIONS = [
  { value: 1, label: "1M" },
  { value: 3, label: "3M" },
  { value: 6, label: "6M" },
  { value: 12, label: "12M" },
];

const LEVEL_BG = ["bg-g-heat-0", "bg-g-heat-1", "bg-g-heat-2", "bg-g-heat-3", "bg-g-heat-4"];

const to12h = (t?: string | null): string | null => {
  if (!t) return null;
  const [hh, mm] = t.split(":");
  let h = parseInt(hh, 10);
  if (Number.isNaN(h)) return null;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${(mm || "00").padStart(2, "0")} ${ampm}`;
};

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const fmtDateShort = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });

const statusText = (day: DayInfo): string => {
  switch (day.kind) {
    case "present": {
      const ci = to12h(day.record?.checkInTime);
      const co = to12h(day.record?.checkOutTime);
      if (ci && co) return `Present, ${ci} to ${co}`;
      if (ci) return `Present, in at ${ci}`;
      return "Present";
    }
    case "absent":
      return "Absent";
    case "off":
      return "Day off / Holiday";
    case "pending":
      return "Pending";
    default:
      return day.future ? "Upcoming" : "No record";
  }
};

const AttendanceHeatmap: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const [rangeMonths, setRangeMonths] = useState<number>(1);
  // Anchor = the month at the END of the visible range.
  const [anchor, setAnchor] = useState<Date>(startOfMonth(new Date()));
  const [hovered, setHovered] = useState<{ day: DayInfo; rect: DOMRect } | null>(null);

  const from = useMemo(
    () => startOfMonth(addMonths(anchor, -(rangeMonths - 1))),
    [anchor, rangeMonths]
  );
  const to = useMemo(() => endOfMonth(anchor), [anchor]);

  const { records, isLoading } = useAttendanceRange(ymd(from), ymd(to));

  const weeks = useMemo(
    () => buildWeeks(from, to, records, today),
    [from, to, records, today]
  );
  const stats = useMemo(() => computeStats(weeks, today), [weeks, today]);

  const canNext = endOfMonth(anchor).getTime() < endOfMonth(today).getTime();
  const rangeLabel =
    rangeMonths === 1
      ? anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : `${from.toLocaleDateString("en-US", { month: "short", year: "numeric" })} – ${to.toLocaleDateString(
          "en-US",
          { month: "short", year: "numeric" }
        )}`;

  const shiftMonths = (delta: number) => setAnchor((a) => addMonths(a, delta));

  // Month labels: show a label above the first week-column of each new month.
  const monthLabels = useMemo(() => {
    let last = "";
    return weeks.map((week) => {
      const firstInRange = week.find((d) => d.inRange) ?? week[0];
      const label = firstInRange.date.toLocaleDateString("en-US", { month: "short" });
      const key = `${firstInRange.date.getFullYear()}-${firstInRange.date.getMonth()}`;
      if (key !== last) {
        last = key;
        return label;
      }
      return "";
    });
  }, [weeks]);

  const stat = (label: string, value: string) => (
    <div className="flex flex-col">
      <span className="text-heading-20 text-g-gray-1000 leading-none">{value}</span>
      <span className="text-label-12 text-g-gray-700 mt-1">{label}</span>
    </div>
  );

  return (
    <section className="bg-g-background-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-heading-16 text-g-gray-1000">Attendance Heatmap</h3>
          <p className="text-label-13 text-g-gray-700">Your daily attendance at a glance</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Range selector */}
          <div className="inline-flex items-center gap-1 border border-g-gray-alpha-400 bg-g-gray-100 rounded-full p-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRangeMonths(opt.value)}
                aria-pressed={rangeMonths === opt.value}
                className={`px-2.5 py-1 rounded-full text-label-12 font-medium transition-colors focus-ring-geist ${
                  rangeMonths === opt.value
                    ? "bg-g-background-100 text-g-gray-1000 shadow-geist-card"
                    : "text-g-gray-700 hover:text-g-gray-1000"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Month nav */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous period"
              onClick={() => shiftMonths(-rangeMonths)}
              className="flex items-center justify-center w-8 h-8 rounded-[var(--g-radius-sm)] text-g-gray-800 hover:bg-g-gray-alpha-100 hover:text-g-gray-1000 transition-colors focus-ring-geist"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-label-13 text-g-gray-900 min-w-[9rem] text-center">
              {rangeLabel}
            </span>
            <button
              type="button"
              aria-label="Next period"
              onClick={() => canNext && shiftMonths(rangeMonths)}
              disabled={!canNext}
              className="flex items-center justify-center w-8 h-8 rounded-[var(--g-radius-sm)] text-g-gray-800 hover:bg-g-gray-alpha-100 hover:text-g-gray-1000 transition-colors focus-ring-geist disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-8 mb-6">
        {stat("Days present", String(stats.present))}
        {stat("Days absent", String(stats.absent))}
        {stat("Attendance rate", `${stats.rate}%`)}
        <div className="flex flex-col">
          <span className="flex items-center gap-1 text-heading-20 text-g-gray-1000 leading-none">
            <Flame size={18} className="text-g-heat-4" />
            {stats.streak}
          </span>
          <span className="text-label-12 text-g-gray-700 mt-1">Current streak</span>
        </div>
      </div>

      {/* Grid (horizontally scrollable) */}
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex gap-2">
          {/* Weekday labels */}
          <div className="flex flex-col gap-1 pr-1 shrink-0">
            <div className="h-4" aria-hidden /> {/* spacer for month-label row */}
            {WEEKDAY_LABELS.map((wd, i) => (
              <div
                key={wd}
                className="h-3.5 flex items-center text-label-12 text-g-gray-700 leading-none"
                aria-hidden
              >
                {i % 2 === 1 ? wd : ""}
              </div>
            ))}
          </div>

          {/* Week columns */}
          <div className="flex flex-col gap-1">
            {/* Month labels row */}
            <div className="flex gap-1 h-4">
              {monthLabels.map((label, i) => (
                <div
                  key={i}
                  className="w-3.5 text-label-12 text-g-gray-700 leading-none overflow-visible whitespace-nowrap"
                >
                  {label}
                </div>
              ))}
            </div>
            {/* Tiles */}
            <div className="flex gap-1">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((day) => {
                    if (!day.inRange) {
                      return <div key={day.key} className="w-3.5 h-3.5" aria-hidden />;
                    }
                    const isAbsent = day.kind === "absent";
                    const bg = day.future ? "bg-g-heat-0 opacity-40" : LEVEL_BG[day.level];
                    return (
                      <button
                        key={day.key}
                        type="button"
                        aria-label={`${fmtDate(day.date)}: ${statusText(day)}`}
                        onMouseEnter={(e) =>
                          setHovered({ day, rect: e.currentTarget.getBoundingClientRect() })
                        }
                        onMouseLeave={() => setHovered(null)}
                        onFocus={(e) =>
                          setHovered({ day, rect: e.currentTarget.getBoundingClientRect() })
                        }
                        onBlur={() => setHovered(null)}
                        className={`w-3.5 h-3.5 rounded-[3px] ${bg} transition-transform motion-reduce:transition-none hover:scale-110 focus-visible:scale-110 focus-ring-geist ${
                          isAbsent ? "ring-1 ring-inset ring-[var(--g-heat-absent-outline)]" : ""
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-5 text-label-12 text-g-gray-700">
        <span className="mr-1">Less</span>
        {LEVEL_BG.map((bg, i) => (
          <span key={i} className={`w-3.5 h-3.5 rounded-[3px] ${bg}`} aria-hidden />
        ))}
        <span className="ml-1">More</span>
        {isLoading && <span className="ml-3 animate-pulse">Loading…</span>}
      </div>

      {/* Tooltip */}
      {hovered && (
        <div
          role="tooltip"
          className="fixed z-[100] pointer-events-none -translate-x-1/2 -translate-y-full"
          style={{ left: hovered.rect.left + hovered.rect.width / 2, top: hovered.rect.top - 8 }}
        >
          <div className="bg-g-gray-1000 rounded-[var(--g-radius-sm)] shadow-geist-menu px-3 py-2">
            <p className="text-g-background-100 text-label-12 font-medium whitespace-nowrap">
              {fmtDateShort(hovered.day.date)} — {statusText(hovered.day)}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default AttendanceHeatmap;
