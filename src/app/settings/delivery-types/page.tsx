"use client";

import { authFetch } from "@/app/_lib/api/authFetch";
import {
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { FormEvent, useState } from "react";
import useSWR from "swr";

type DeliveryType = {
  id: string;
  name: string;
  currentUnitPrice: number;
  sortOrder: number;
  isActive: boolean;
};

type DeliveryTypeUpdate = {
  name?: string;
  currentUnitPrice?: number;
  sortOrder?: number;
  isActive?: boolean;
};

type EditorValues = {
  name: string;
  currentUnitPrice: number;
};

type DeliveryTypeModalProps = {
  title: string;
  submitLabel: string;
  initialValues?: EditorValues;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: EditorValues) => Promise<boolean>;
};

const deliveryTypesUrl = "/api/delivery-types?includeInactive=true";

const fetchDeliveryTypes = (url: string) =>
  authFetch<DeliveryType[]>(url);

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "処理に失敗しました";

const DeliveryTypeModal = ({
  title,
  submitLabel,
  initialValues,
  isSaving,
  onClose,
  onSubmit,
}: DeliveryTypeModalProps) => {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [currentUnitPrice, setCurrentUnitPrice] = useState(
    initialValues ? String(initialValues.currentUnitPrice) : ""
  );
  const [validationError, setValidationError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const unitPriceNumber = Number(currentUnitPrice);

    if (
      name.trim() === "" ||
      name.trim().length > 50 ||
      currentUnitPrice === "" ||
      !Number.isInteger(unitPriceNumber) ||
      unitPriceNumber < 0
    ) {
      setValidationError("サイズ名と単価を正しく入力してください");
      return;
    }

    setValidationError("");

    const succeeded = await onSubmit({
      name: name.trim(),
      currentUnitPrice: unitPriceNumber,
    });

    if (succeeded) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delivery-type-modal-title"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id="delivery-type-modal-title" className="text-lg font-extrabold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="閉じる"
            className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground disabled:opacity-50"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-bold">
            サイズ名
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={50}
              placeholder="例：60サイズ"
              disabled={isSaving}
              autoFocus
              className="mt-2 block w-full rounded-xl border-0 bg-input-background px-4 py-3 text-base font-normal outline-none ring-1 ring-transparent transition focus:ring-primary disabled:opacity-50 md:text-sm"
            />
          </label>

          <label className="block text-sm font-bold">
            1件あたりの単価
            <div className="mt-2 flex items-center rounded-xl bg-input-background px-4 ring-1 ring-transparent transition focus-within:ring-primary">
              <span className="text-sm text-muted-foreground">¥</span>
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={currentUnitPrice}
                onChange={(event) => setCurrentUnitPrice(event.target.value)}
                placeholder="185"
                disabled={isSaving}
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base font-normal outline-none disabled:opacity-50 md:text-sm"
              />
              <span className="text-sm text-muted-foreground">/ 件</span>
            </div>
          </label>

          {validationError && (
            <p role="alert" className="text-sm text-destructive">
              {validationError}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-border bg-white px-4 py-3 text-sm font-bold disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "保存中..." : submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

type DeliveryTypeRowProps = {
  deliveryType: DeliveryType;
  isSaving: boolean;
  onEdit: (deliveryType: DeliveryType) => void;
  onToggle: (deliveryType: DeliveryType) => Promise<void>;
};

const DeliveryTypeRow = ({
  deliveryType,
  isSaving,
  onEdit,
  onToggle,
}: DeliveryTypeRowProps) => (
  <li className={deliveryType.isActive ? "" : "bg-muted/45"}>
    <div className="flex min-h-20 items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold">{deliveryType.name}</p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              deliveryType.isActive
                ? "bg-green-100 text-green-700"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {deliveryType.isActive ? "使用中" : "非表示"}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          ¥{deliveryType.currentUnitPrice.toLocaleString("ja-JP")} / 件
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onToggle(deliveryType)}
          disabled={isSaving}
          aria-label={deliveryType.isActive ? "非表示にする" : "再表示する"}
          className={`flex size-9 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50 ${
            deliveryType.isActive
              ? "bg-muted text-muted-foreground"
              : "border border-primary bg-white text-primary"
          }`}
        >
          {deliveryType.isActive ? (
            <EyeOff size={16} aria-hidden="true" />
          ) : (
            <Eye size={16} aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onEdit(deliveryType)}
          disabled={isSaving}
          aria-label={`${deliveryType.name}を編集`}
          className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Pencil size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  </li>
);

export default function DeliveryTypesSettingsPage() {
  const { data, error, isLoading, mutate } = useSWR<DeliveryType[]>(
    deliveryTypesUrl,
    fetchDeliveryTypes
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDeliveryType, setEditingDeliveryType] =
    useState<DeliveryType | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const activeDeliveryTypes = data?.filter((item) => item.isActive) ?? [];
  const inactiveDeliveryTypes = data?.filter((item) => !item.isActive) ?? [];

  const clearActionMessage = () => {
    setActionError("");
    setActionMessage("");
  };

  const handleCreate = async (values: EditorValues) => {
    setIsCreating(true);
    clearActionMessage();

    const nextSortOrder =
      data && data.length > 0
        ? Math.max(...data.map((item) => item.sortOrder)) + 1
        : 1;

    try {
      await authFetch<DeliveryType>("/api/delivery-types", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          sortOrder: nextSortOrder,
        }),
      });

      setActionMessage("配送サイズを追加しました");
      await mutate();
      return true;
    } catch (createError) {
      setActionError(getErrorMessage(createError));
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (id: string, values: DeliveryTypeUpdate) => {
    setSavingId(id);
    clearActionMessage();

    try {
      await authFetch<DeliveryType>(`/api/delivery-types/${id}`, {
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
      setActionError(getErrorMessage(updateError));
      return false;
    } finally {
      setSavingId(null);
    }
  };

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
                {getErrorMessage(error)}
              </p>
            )}

            {!isLoading && !error && activeDeliveryTypes.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                配送サイズはまだ登録されていません
              </p>
            )}

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

        {(actionError || actionMessage) && (
          <div
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
