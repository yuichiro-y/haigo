import { useFetch } from "@/app/_hooks/useFetch";
import { DailyRecord } from "@/app/_lib/validation/dailyRecord";
import { X } from "lucide-react";
import { format, parseISO } from "date-fns";
import Link from "next/link";

type Props = {
  date: string;
  isOpen: boolean;
  onClose: () => void;
};

export const DailyRecordDetail = ({ date, isOpen, onClose }: Props) => {
  const {
    data: dailyRecord,
    error,
    isLoading,
  } = useFetch<DailyRecord | null>(`/api/daily_records?date=${date}`);

  const totalRevenue = dailyRecord
    ? dailyRecord.dailyRecordItems.reduce(
        (total, item) => total + item.unitPriceSnapshot * item.quantity,
        0,
      ) +
      dailyRecord.customRevenues.reduce((total, item) => total + item.amount, 0)
    : 0;

  return (
    <div>
      <div
        className={`fixed inset-0 z-50 bg-foreground/40 transition-opacity duration-300 motion-reduce:transition-none ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed bottom-0 left-1/2 z-50 flex max-h-[85dvh] w-full max-w-lg -translate-x-1/2 flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/*「つまみ（ハンドル）」パーツ */}
        <div
          className="mx-auto mt-3 h-1 w-10 shrink-0 cursor-pointer rounded-full bg-border active:bg-muted-foreground"
          onClick={onClose}
        />
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-2 sm:px-6">
          <div>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {format(parseISO(date), "M月d日")}
            </p>
            <p className="text-xs text-muted-foreground">配達記録</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              読み込み中...
            </p>
          ) : error ? (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-card px-4 py-5 text-sm text-destructive"
            >
              記録の取得に失敗しました
            </p>
          ) : dailyRecord === null ? (
            <>
              <p className="rounded-xl border border-dashed border-border bg-card px-4 py-7 text-center text-sm text-muted-foreground">
                この日の記録はありません
              </p>

              <Link
                href={`/daily_record?date=${date}`}
                className="flex min-h-11 w-full items-center justify-center rounded-2xl border border-primary/30 bg-secondary px-4 py-3 mt-2 text-sm font-semibold text-primary"
              >
                この日の記録をつける
              </Link>
            </>
          ) : dailyRecord === undefined ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              読み込み中...
            </p>
          ) : (
            <>
              <p className="text-4xl font-extrabold tracking-tight text-primary tabular-nums">
                ¥{totalRevenue.toLocaleString()}
              </p>
              <div className="my-2 divide-y divide-border">
                {dailyRecord.dailyRecordItems.map((item) => (
                  <div
                    key={item.deliveryTypeId}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                      <p className="text-sm font-medium break-words text-foreground">
                        {item.nameSnapshot}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        ¥{item.unitPriceSnapshot.toLocaleString()}/件
                      </p>
                    </div>
                    <div className="flex shrink-0 items-baseline gap-2 text-right tabular-nums">
                      <p className="text-sm font-bold text-foreground">
                        {item.quantity}件
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ¥
                        {(
                          item.unitPriceSnapshot * item.quantity
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {dailyRecord.customRevenues.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-baseline justify-between gap-3 py-3"
                  >
                    <p className="min-w-0 text-sm break-words text-foreground">
                      {item.name}
                    </p>
                    <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      ¥{item.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mb-5 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground break-words empty:hidden">
                {dailyRecord.memo}
              </p>
              {/* 日付を指定した編集画面への遷移は未実装 */}
              <Link
                href={`/daily_record?date=${date}`}
                className="flex min-h-11 w-full items-center justify-center rounded-2xl border border-primary/30 bg-secondary px-4 py-3 text-sm font-semibold text-primary"
              >
                この日を編集する
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
