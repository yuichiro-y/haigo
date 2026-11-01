"use client"

import { addMonths, format, parseISO, subMonths } from "date-fns";
import { StatisticsSummaryCard } from "../_components/Statistics/StatisticsSummaryCard";
import { useFetch } from "../_hooks/useFetch";
import { StatisticsResponse } from "../_types/statistics";
import { useRouter, useSearchParams } from "next/navigation";
import { MobileNavigation } from "../_components/Navigation/MobileNavigation";
import { Suspense } from "react";
import { DailyRevenueChart } from "../_components/Statistics/DailyRevenueChart";
import { DateNavigationButton } from "../_components/Button/DateNavigationButton";

function StatisticsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const monthFromUrl = searchParams.get("month");

  const isValidMonth =
    monthFromUrl !== null &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(monthFromUrl);

  const displayMonth = isValidMonth
    ? parseISO(`${monthFromUrl}-01`)
    : new Date();
  const {
    data,
    error,
    isLoading,
  } = useFetch<StatisticsResponse>(
    `/api/statistics?month=${format(displayMonth, "yyyy-MM")}`,
  );

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <p
          className="w-full max-w-md rounded-xl border border-destructive/30 bg-card px-4 py-3 text-sm text-destructive shadow-sm"
          role="alert"
        >
          {error instanceof Error
            ? error.message
            : "情報の取得に失敗しました"}
        </p>
      </main>
    );
  }

  // データが取得できていない場合は表示しない
  if (data === undefined) {
    return null;
  }

  const sizeTotals = Object.entries(data.deliveryTypesTotal);

  const totalQuantity = sizeTotals.reduce(
    (total, [, item]) => total + item.quantity,
    0,
  );

  const handlePreviousMonth = () => {
    const previousMonth = subMonths(displayMonth, 1);

    router.replace(
      `/statistics?month=${format(previousMonth, "yyyy-MM")}`,
      { scroll: false },
    );
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(displayMonth, 1);

    router.replace(
      `/statistics?month=${format(nextMonth, "yyyy-MM")}`,
      { scroll: false },
    );
  };

  return (
    <>
      <main className="min-h-screen bg-background px-3 pb-28 sm:px-6 sm:pt-6 md:pb-10 lg:py-5">
        <div className="mx-auto w-full max-w-[734px]">
          <header className="sticky top-0 z-20 -mx-3 px-3 mb-1 flex items-center justify-between border-b border-border bg-background text-center py-1 sm:mb-2 sm:mt-0 md:mb-3">
            <DateNavigationButton
              direction="previous"
              label="前月の統計を表示"
              onClick={handlePreviousMonth}
            />
              <p className="text-base font-bold text-foreground sm:text-lg">
                {format(displayMonth, "yyyy 年 M 月")}
              </p>

            <DateNavigationButton
              direction="next"
              label="翌月の統計を表示"
              onClick={handleNextMonth}
            />
          </header>

          {/* カード */}
          <div className="grid grid-cols-2 gap-2">
            <StatisticsSummaryCard
              label="月間収益"
              value={`¥${Math.floor(data.monthlyRevenue).toLocaleString('ja-JP')}`}
              sub={`${format(displayMonth, "yyyy年M月")}`}
            />
            <StatisticsSummaryCard
              label="1日平均収益"
              value={`¥${Math.floor(data.averageDay).toLocaleString('ja-JP')}`}
              sub={`稼働日数: ${data.operatingDays} 日`}
            />
            <StatisticsSummaryCard
              label="最高日収益"
              value={data.highestRevenueDay
                ? `¥${Math.floor(data.highestRevenueDay.totalRevenue).toLocaleString('ja-JP')}`
                : "記録なし"
              }
              sub={data.highestRevenueDay
                ? `日付: ${format(parseISO(data.highestRevenueDay.workDate), "M月d日")}`
                : "この月の記録はありません"
              }
            />
          </div>
          <DailyRevenueChart days={data.days}/>

          {/* サイズ別配達数 */}
          {sizeTotals.length === 0 ? (
          <section className="mt-2 rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="mb-4 text-sm font-bold">サイズ別配達数</h2>
            <p className="py-6 text-center text-sm text-muted-foreground">
              この月の記録はありません
            </p>
          </section>
          ) : (
              <section className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex justify-between">
                  <h2 className="mb-4 text-sm font-bold">サイズ別配達数</h2>
                  <div className="flex items-baseline">
                    <p className="text-xs text-muted-foreground border-b border-dashed border-border">
                      合計個数:
                      <span className="mx-1 text-xl font-bold text-primary">
                        {totalQuantity.toLocaleString("ja-JP")}
                      </span>
                      個
                    </p>

                  </div>
                </div>
                {sizeTotals.map(([id, item]) => (
                  <div  key={id} className="py-2">
                    <div className="mb-2 flex justify-between text-sm">
                      <span>{item.name}</span>
                      <div className="flex items-baseline gap-3">
                        <span className="font-bold">
                          {item.quantity.toLocaleString("ja-JP")}件
                        </span>
                        <span className="text-muted-foreground">
                          ¥{item.revenue.toLocaleString("ja-JP")}
                        </span>
                      </div>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${
                            totalQuantity > 0
                              ? (item.quantity / totalQuantity) * 100
                              : 0
                          }%`,
                          backgroundImage:
                            "linear-gradient(to right, color-mix(in srgb, var(--primary) 65%, var(--card)), color-mix(in srgb, var(--primary) 85%, red))",
                          backgroundSize: "100% 100%",
                          backgroundRepeat: "no-repeat",

                        }}
                      />
                    </div>
                  </div>
                ))}
              </section>
            )}
        </div>
      </main>
      <MobileNavigation />
    </>
  )
}

export default function StatisticsPage() {
  return (
    <Suspense fallback={<p>読み込み中...</p>}>
      <StatisticsContent />
    </Suspense>
  );
}