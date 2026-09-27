"use client";

import { useState } from "react";
import { MobileNavigation } from "@/app/_components/Navigation/MobileNavigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarResponse } from "@/app/_types/calendar";
import { useFetch } from "@/app/_hooks/useFetch";
import { CalendarSummaryCard } from "@/app/_components/Calendar/CalendarSummaryCard";
import { DailyRecordDetail } from "@/app/_components/Calendar/DailyRecordDetail";

export default function CalendarPage() {
  const [displayMonth, setDisplayMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const {
    data: calendarData,
    error: calendarDaysError,
    isLoading: isCalendarDaysLoading,
  } = useFetch<CalendarResponse>(
    `/api/calendar?month=${format(displayMonth, "yyyy-MM")}`,
  );

  // データを取得している間はカレンダーを表示しない
  if (isCalendarDaysLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </main>
    );
  }

  // カレンダー取得に失敗した場合は、先に見つかったエラーを表示する
  if (calendarDaysError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <p
          className="w-full max-w-md rounded-xl border border-destructive/30 bg-card px-4 py-3 text-sm text-destructive shadow-sm"
          role="alert"
        >
          {calendarDaysError instanceof Error
            ? calendarDaysError.message
            : "情報の取得に失敗しました"}
        </p>
      </main>
    );
  }

  // データが取得できていない場合は表示しない
  if (calendarData === undefined) {
    return null;
  }

  // 現在は日曜始まり。設定画面から変更可能にする予定
  const weekStartsOn = 0;
  const calendarStart = startOfWeek(startOfMonth(displayMonth), {
    weekStartsOn,
  });
  const calendarEnd = endOfWeek(endOfMonth(displayMonth), {
    weekStartsOn,
  });

  // 日付が35個または42個並んだ配列
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // 7日ずつに分かれた5週または6週の配列
  const calendarWeeks = Array.from(
    { length: calendarDays.length / 7 },
    (_, index) => calendarDays.slice(index * 7, index * 7 + 7),
  );

  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  const handlePreviousMonth = () => {
    setDisplayMonth((c) => subMonths(c, 1));
  };

  const handleNextMonth = () => {
    setDisplayMonth((c) => addMonths(c, 1));
  };

  return (
    <>
      <main className="min-h-screen bg-background px-3 pt-2 pb-28 sm:px-6 sm:pt-6 md:pb-10 lg:py-10">
        <div className="mx-auto w-full max-w-[734px]">
          <header className="mb-3 flex h-14 items-center justify-between text-center sm:mb-4">
            <button
              type="button"
              onClick={handlePreviousMonth}
              className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <ChevronLeft size={24} strokeWidth={2} />
            </button>

            <p className="text-base font-bold text-foreground sm:text-lg">
              {format(displayMonth, "yyyy 年 M 月")}
            </p>

            <button
              type="button"
              onClick={handleNextMonth}
              className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <ChevronRight size={24} strokeWidth={2} />
            </button>
          </header>

          {/* サマリー */}
          <div className="mb-4 grid grid-cols-3 gap-3 [&>div:first-child>p:first-child]:text-primary">
            <CalendarSummaryCard
              value={`¥${calendarData.monthlyRevenue.toLocaleString()}`}
              label="月間収益"
            />
            <CalendarSummaryCard
              value={`¥${calendarData.averageDay.toLocaleString()}`}
              label="1日平均"
            />
            <CalendarSummaryCard
              value={`${calendarData.operatingDays}日`}
              label="稼働日数"
            />
          </div>

          {/* カレンダー */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full table-fixed border-separate border-spacing-0">
              <thead className="bg-muted/40">
                <tr>
                  {weekDays.map((weekDay) => (
                    <th
                      key={weekDay}
                      className={`h-9 text-xs font-medium sm:h-10 ${
                        weekDay === "日" ? "text-destructive" : ""
                      } ${weekDay === "土" ? "text-[var(--chart-blue)]" : ""}`}
                    >
                      {weekDay}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {calendarWeeks.map((week, weekIndex) => (
                  <tr key={weekIndex}>
                    {week.map((day) => {
                      const datekey = format(day, "yyyy-MM-dd");
                      const isDisplayedMonth = isSameMonth(day, displayMonth);
                      const isCurrentDay = isToday(day);
                      const record = calendarData.days.find(
                        (d) => d.workDate === datekey,
                      );

                      return (
                        <td
                          key={day.toISOString()}
                          className={`border-t border-r border-border p-0 align-top last:border-r-0 ${
                            isDisplayedMonth
                              ? "text-foreground"
                              : "bg-muted/30 text-muted-foreground/40"
                          } ${
                            isCurrentDay && isDisplayedMonth
                              ? "bg-secondary"
                              : ""
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDate(datekey);
                              setIsOpen(true);
                            }}
                            className="flex min-h-20 w-full flex-col items-start gap-1 px-1 py-2 text-left transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:min-h-24 sm:px-3 sm:py-3"
                          >
                            <p
                              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:text-sm ${isCurrentDay && isDisplayedMonth ? "bg-primary text-primary-foreground" : ""}`}
                            >
                              {format(day, "d")}
                            </p>
                            {isDisplayedMonth && record && (
                              <p className="w-full text-[10px] leading-tight font-medium break-all text-muted-foreground tabular-nums sm:text-xs">
                                ¥{record.totalRevenue.toLocaleString()}
                              </p>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedDate && (
            <DailyRecordDetail
              date={selectedDate}
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
            />
          )}
        </div>
      </main>

      <MobileNavigation />
    </>
  );
}
