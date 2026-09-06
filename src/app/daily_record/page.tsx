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
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
  }).format(new Date());
  const {
    data: deliveryTypes,
    error: deliveryTypesError,
    isLoading: isDeliveryTypesLoading,
  } = useFetch<DeliveryType[]>("/api/delivery_types?activeOnly=true");
  const {
    data: dailyRecord,
    error: dailyRecordError,
    isLoading: isDailyRecordLoading,
    mutate: mutateDailyRecord,
  } = useFetch<DailyRecord | null>(`/api/daily_records?date=${today}`);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  if (isDailyRecordLoading || isDeliveryTypesLoading) {
    return <p>読み込み中...</p>;
  }

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

  if (!deliveryTypes || dailyRecord === undefined) {
    return null;
  }

  const clearActionMessage = () => {
    setActionError("");
    setActionMessage("");
  };

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
