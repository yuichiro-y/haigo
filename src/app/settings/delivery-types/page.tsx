"use client";

import { authFetch } from "@/app/_lib/api/authFetch";
import {
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Plus,
} from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import {
  deliveryTypesSchema,
  type DeliveryType,
  type CreateDeliveryTypeInput,
  type UpdateDeliveryTypeInput,
} from "@/app/_lib/validation/deliveryType";
import { DeliveryTypeModal } from "@/app/_components/Modal/DeliveryTypeModal";
import { DeliveryTypeRow } from "@/app/_components/DeliveryType/DeliveryTypeRow";

// 配送サイズ一覧取得用のURLを定義
const deliveryTypesUrl = "/api/delivery-types";

// 配送サイズ一覧を取得する関数を定義
const fetchDeliveryTypes = async (url: string) => {
  const response = await authFetch(url);
  const result = deliveryTypesSchema.safeParse(
    await response.json(),
  );

  if (!result.success) {
    throw new Error("配送サイズ一覧の取得に失敗しました");
  }

  return result.data;
};

// 配送サイズ設定ページのコンポーネントを定義
export default function DeliveryTypesSettingsPage() {
  const { data, error, isLoading, mutate } = useSWR<DeliveryType[]>(
    deliveryTypesUrl,
    fetchDeliveryTypes
  );  // 配送サイズ一覧を取得するSWRフックを使用
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // 配送サイズ追加モーダルの表示状態を管理
  const [editingDeliveryType, setEditingDeliveryType] =
    useState<DeliveryType | null>(null); // 配送サイズ編集モーダルの表示状態を管理
  const [showInactive, setShowInactive] = useState(false); // 非表示の配送サイズを表示するかどうかを管理
  const [savingId, setSavingId] = useState<string | null>(null); // 配送サイズの保存中のIDを管理
  const [isCreating, setIsCreating] = useState(false); // 配送サイズ追加中の状態を管理
  const [actionError, setActionError] = useState(""); // 配送サイズ追加・編集のアクションエラーを管理
  const [actionMessage, setActionMessage] = useState(""); // 配送サイズ追加・編集のアクションメッセージを管理

  const activeDeliveryTypes = data?.filter((item) => item.isActive) ?? []; // 表示中の配送サイズ一覧を取得
  const inactiveDeliveryTypes = data?.filter((item) => !item.isActive) ?? []; // 非表示の配送サイズ一覧を取得

  // アクションメッセージとエラーをクリアする関数を定義
  const clearActionMessage = () => {
    setActionError("");
    setActionMessage("");
  };

  // 配送サイズ追加の処理を定義
  const handleCreate = async (values: CreateDeliveryTypeInput) => {
    setIsCreating(true);
    clearActionMessage();

    try {
      await authFetch("/api/delivery-types", {
        method: "POST",
        body: JSON.stringify(values),
      });

      setActionMessage("配送サイズを追加しました");
      await mutate();
      return true;
    } catch (createError) {
      setActionError(
        createError instanceof Error
          ? createError.message
          : "配送サイズの追加に失敗しました"
      );
      return false;
    } finally {
      setIsCreating(false);
    }
  };
  // 配送サイズ更新の処理を定義
  const handleUpdate = async (id: string, values: UpdateDeliveryTypeInput) => {
    setSavingId(id);
    clearActionMessage();

    try {
      await authFetch(`/api/delivery-types/${id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      });

      setActionMessage(
        "isActive" in values
          ? values.isActive
            ? "配送サイズを再表示しました"
            : "配送サイズを非表示にしました"
          : "配送サイズを更新しました"
      );
      await mutate();
      return true;
    } catch (updateError) {
      setActionError(
        updateError instanceof Error
          ? updateError.message
          : "配送サイズの更新に失敗しました"
      );
      return false;
    } finally {
      setSavingId(null);
    }
  };

  // 配送サイズの表示状態を切り替える処理を定義
  const handleToggle = async (deliveryType: DeliveryType) => {
    await handleUpdate(deliveryType.id, {
      isActive: !deliveryType.isActive,
    });
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-6">
          <h1 className="text-2xl font-extrabold">設定</h1>
        </header>

        {/* 配送サイズ・単価設定 */}
        <section aria-labelledby="delivery-type-settings-heading">
          <p className="mb-2 text-xs font-bold text-muted-foreground">
            配送サイズ・単価設定
          </p>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 py-3">
              <h2 id="delivery-type-settings-heading" className="sr-only">
                配送サイズ・単価設定
              </h2>
              <p className="text-xs text-muted-foreground">
                配送記録で使用するサイズ名と1件あたりの単価を設定できます
              </p>
            </div>

            {isLoading && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                読み込み中...
              </p>
            )}

            {error && (
              <p
                role="alert"
                className="flex items-center gap-2 px-4 py-5 text-sm text-destructive"
              >
                <CircleAlert size={18} aria-hidden="true" />
                {error instanceof Error
                  ? error.message
                  : "配送サイズの取得に失敗しました"}
              </p>
            )}

            {!isLoading && !error && activeDeliveryTypes.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                配送サイズはまだ登録されていません
              </p>
            )}

            {/* 配送サイズ一覧 */}
            {activeDeliveryTypes.length > 0 && (
              <ul className="divide-y divide-border">
                {activeDeliveryTypes.map((deliveryType) => (
                  <DeliveryTypeRow
                    key={deliveryType.id}
                    deliveryType={deliveryType}
                    isSaving={savingId === deliveryType.id}
                    onEdit={setEditingDeliveryType}
                    onToggle={handleToggle}
                  />
                ))}
              </ul>
            )}

            {/* 非表示の配送サイズ */}
            {inactiveDeliveryTypes.length > 0 && (
              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowInactive((current) => !current)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold"
                  aria-expanded={showInactive}
                >
                  非表示のサイズを表示（{inactiveDeliveryTypes.length}件）
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`transition-transform ${
                      showInactive ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* 非表示の配送サイズ */}
                {showInactive && (
                  <ul className="divide-y divide-border border-t border-border">
                    {inactiveDeliveryTypes.map((deliveryType) => (
                      <DeliveryTypeRow
                        key={deliveryType.id}
                        deliveryType={deliveryType}
                        isSaving={savingId === deliveryType.id}
                        onEdit={setEditingDeliveryType}
                        onToggle={handleToggle}
                      />
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* 配送サイズ追加ボタン */}
            <button
              type="button"
              onClick={() => {
                clearActionMessage();
                setIsAddModalOpen(true);
              }}
              className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-sm font-bold text-primary"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-secondary">
                <Plus size={14} aria-hidden="true" />
              </span>
              配送サイズを追加
            </button>
          </div>
        </section>

        {/* どちらかに文字が入っていれば表示する。 */}
        {(actionError || actionMessage) && (
          <div
          // エラーがある場合はalert、メッセージのみの場合はstatusとして扱う
            role={actionError ? "alert" : "status"}
            className={`mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${
              actionError
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-orange-200 bg-orange-50 text-orange-700"
            }`}
          >
            {actionError ? (
              <CircleAlert size={18} aria-hidden="true" />
            ) : (
              <CircleCheck size={18} aria-hidden="true" />
            )}
            {actionError || actionMessage}
          </div>
        )}
      </div>

      {/* 配送サイズ追加・編集モーダル */}
      {isAddModalOpen && (
        <DeliveryTypeModal
          key="add-delivery-type"
          title="配送サイズを追加"
          submitLabel="追加する"
          isSaving={isCreating}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* 配送サイズ編集モーダル */}
      {editingDeliveryType && (
        <DeliveryTypeModal
          key={editingDeliveryType.id}
          title="配送サイズを編集"
          submitLabel="変更を保存"
          initialValues={{
            name: editingDeliveryType.name,
            currentUnitPrice: editingDeliveryType.currentUnitPrice,
          }}
          isSaving={savingId === editingDeliveryType.id}
          onClose={() => setEditingDeliveryType(null)}
          onSubmit={(values) => handleUpdate(editingDeliveryType.id, values)}
        />
      )}
    </main>
  );
}
