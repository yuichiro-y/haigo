"use client";

import { useState } from "react";
import { MobileNavigation } from "../_components/Navigation/MobileNavigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarResponse } from "@/app/_types/calendar";
import { useFetch } from "@/app/_hooks/useFetch";

export default function CalendarPage() {
  const [displayMonth, setDisplayMonth] = useState(new Date());
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
      <main className="min-h-screen bg-background px-3 pb-28 sm:px-6 md:pb-10 lg:py-10">
        <div className="mx-auto w-full max-w-[470px]">
          <header className="flex justify-between my-3 border-b border-border py-3 text-center">
            <button
              type="button"
              onClick={handlePreviousMonth}
              className="mr-10"
            >
              <ChevronLeft size={24} strokeWidth={2} />
            </button>

            <p className="font-bold text-foreground">
              {format(displayMonth, "yyyy 年 M 月")}
            </p>

            <button type="button" onClick={handleNextMonth} className="ml-10">
              <ChevronRight size={24} strokeWidth={2} />
            </button>
          </header>

          {/* サマリー */}
          <div className="flex justify-between mb-2">
            <div className="text-center p-2">
              <p>¥ {calendarData.monthlyRevenue.toLocaleString()}</p>
              <p>月間収益</p>
            </div>
            <div className="text-center p-2">
              <p>{calendarData.operatingDays} 日</p>
              <p>稼働日数</p>
            </div>
          </div>

          {/* カレンダー */}
          <table className="w-full table-fixed">
            <thead>
              <tr>
                {weekDays.map((weekDay) => (
                  <th key={weekDay}>{weekDay}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {calendarWeeks.map((week, weekIndex) => (
                <tr key={weekIndex}>
                  {week.map((day) => {
                    const datekey = format(day, "yyyy-MM-dd");

                    const record = calendarData.days.find(
                      (d) => d.workDate === datekey,
                    );
                    return (
                      <td
                        key={day.toISOString()}
                        className="p-2 border border-border"
                      >
                        <p>{format(day, "d")}</p>
                        {record && (
                          <p className="text-[11px]">
                            ¥{record.totalRevenue.toLocaleString()}
                          </p>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <MobileNavigation />
    </>
  );
}
