"use client";

import { useFetch } from "@/app/_hooks/useFetch";
import { DeliveryType } from "@/app/_lib/validation/deliveryType";
import { DailyRecord } from "@/app/_lib/validation/dailyRecord";
import { useState } from "react";
import {
  CreateDailyRecordInput,
  UpdateDailyRecordInput,
} from "@/app/_lib/validation/dailyRecord";
import { authFetch } from "@/app/_lib/api/authFetch";
import { DailyRecordForm } from "../_components/DailyRecord/DailyRecordForm";

export default function DailyRecordPage() {
  // 日本時間の今日を、日次記録APIが受け取るYYYY-MM-DD形式にする
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
  }).format(new Date());

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
  } = useFetch<DailyRecord | null>(`/api/daily_records?date=${today}`);

  // 保存・更新の結果を画面へ表示するために保持する
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  // 配送サイズと今日の記録を取得している間はフォームを表示しない
  if (isDailyRecordLoading || isDeliveryTypesLoading) {
    return <p>読み込み中...</p>;
  }

  // どちらかの取得に失敗した場合は、先に見つかったエラーを表示する
  if (dailyRecordError || deliveryTypesError) {
    const fetchError = dailyRecordError ?? deliveryTypesError;

    return (
      <p role="alert">
        {fetchError instanceof Error
          ? fetchError.message
          : "情報の取得に失敗しました"}
      </p>
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
      workDate: today,
    });
  };

  return (
    <>
      <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto w-full max-w-xl">
          <div className="text-center border-b">
            <h1>今日の記録</h1>
            <p className="mb-2">{today}</p>
          </div>

          <DailyRecordForm
            deliveryTypes={deliveryTypes}
            dailyRecord={dailyRecord}
            onSave={handleSave}
          />
        </div>

        {actionError && <p role="alert">{actionError}</p>}

        {actionMessage && <p role="status">{actionMessage}</p>}
      </main>
    </>
  );
}
