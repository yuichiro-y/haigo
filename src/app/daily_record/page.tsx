"use client";

import { useFetch } from "@/app/_hooks/useFetch";
import { DeliveryType } from "@/app/_lib/validation/deliveryType";
import { DailyRecord } from "@/app/_lib/validation/dailyRecord";
import { Suspense, useState } from "react";
import {
  CreateDailyRecordInput,
  UpdateDailyRecordInput,
} from "@/app/_lib/validation/dailyRecord";
import { authFetch } from "@/app/_lib/api/authFetch";
import { DailyRecordForm } from "../_components/DailyRecord/DailyRecordForm";
import { MobileNavigation } from "@/app/_components/Navigation/MobileNavigation";
import { useSearchParams } from "next/navigation";

function DailyRecordContent() {
  // 日本時間の今日を、日次記録APIが受け取るYYYY-MM-DD形式にする
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
  }).format(new Date());

  const searchParams = useSearchParams();
  const dateFromUrl = searchParams.get("date");
  const targetDate = dateFromUrl ?? today;

  // 今日の入力欄に表示する、使用中の配送サイズだけを取得する
  const {
    data: deliveryTypes,
    error: deliveryTypesError,
    isLoading: isDeliveryTypesLoading,
  } = useFetch<DeliveryType[]>("/api/delivery_types?activeOnly=true");

  // 今日の保存済み記録を取得する。未登録の場合はnullが返る
  const {
    data: dailyRecord,
    error: dailyRecordError,
    isLoading: isDailyRecordLoading,
    mutate: mutateDailyRecord,
  } = useFetch<DailyRecord | null>(`/api/daily_records?date=${targetDate}`);

  // 保存・更新の結果を画面へ表示するために保持する
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  // 配送サイズと今日の記録を取得している間はフォームを表示しない
  if (isDailyRecordLoading || isDeliveryTypesLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </main>
    );
  }

  // どちらかの取得に失敗した場合は、先に見つかったエラーを表示する
  if (dailyRecordError || deliveryTypesError) {
    const fetchError = dailyRecordError ?? deliveryTypesError;

    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <p
          className="w-full max-w-md rounded-xl border border-destructive/30 bg-card px-4 py-3 text-sm text-destructive shadow-sm"
          role="alert"
        >
          {fetchError instanceof Error
            ? fetchError.message
            : "情報の取得に失敗しました"}
        </p>
      </main>
    );
  }

  // undefinedは取得未完了、nullは今日の記録が未登録という正常な状態
  if (!deliveryTypes || dailyRecord === undefined) {
    return null;
  }

  // 新しい保存処理を始める前に、前回の結果表示を消す
  const clearActionMessage = () => {
    setActionError("");
    setActionMessage("");
  };

  // 未登録の日次記録をPOSTで新規作成する
  const handleCreate = async (values: CreateDailyRecordInput) => {
    clearActionMessage();

    try {
      await authFetch("/api/daily_records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      setActionMessage("今日の記録を保存しました");
      // 作成結果を取得し直し、以後の保存をPATCHへ切り替える
      mutateDailyRecord();
      return true;
    } catch (createError) {
      setActionError(
        createError instanceof Error
          ? createError.message
          : "今日の記録の保存に失敗しました",
      );
      return false;
    }
  };

  // 保存済みの日次記録をID指定のPATCHで更新する
  const handleUpdate = async (id: string, values: UpdateDailyRecordInput) => {
    clearActionMessage();

    try {
      await authFetch(`/api/daily_records/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      setActionMessage("今日の記録を更新しました");
      // 更新後の記録をAPIから取得し直す
      mutateDailyRecord();
      return true;
    } catch (createError) {
      setActionError(
        createError instanceof Error
          ? createError.message
          : "今日の記録の更新に失敗しました",
      );
      return false;
    }
  };

  // 今日の記録があるかどうかで、POSTとPATCHを振り分ける
  const handleSave = async (values: UpdateDailyRecordInput) => {
    if (dailyRecord) {
      return handleUpdate(dailyRecord.id, values);
    }

    return handleCreate({
      ...values,
      workDate: targetDate,
    });
  };

  return (
    <>
      <main className="min-h-screen bg-background px-3 pb-28 sm:px-6 md:pb-10 lg:py-10">
        <div className="mx-auto w-full max-w-[470px]">
              <header className="mb-3 border-b border-border py-3 text-center">
                {targetDate === today
                  ? <h1 className="text-sm font-bold">今日の記録</h1>
                  : <h1 className="text-sm font-bold">配達記録</h1>
                }
                  <p className="mt-0.5 text-xs text-muted-foreground">{targetDate}</p>
              </header>

          {actionError && (
            <p
              className="mb-3 rounded-xl border border-destructive/30 bg-card px-4 py-3 text-sm text-destructive shadow-sm"
              role="alert"
            >
              {actionError}
            </p>
          )}

          {actionMessage && (
            <p
              className="mb-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-[var(--chart-green)] shadow-sm"
              role="status"
            >
              {actionMessage}
            </p>
          )}

          <DailyRecordForm
            deliveryTypes={deliveryTypes}
            dailyRecord={dailyRecord}
            onSave={handleSave}
          />
        </div>
      </main>
      <MobileNavigation />
    </>
  );
}

export default function DailyRecordPage() {
  return (
    <Suspense fallback={<p>読み込み中...</p>}>
      <DailyRecordContent />
    </Suspense>
  );
}
