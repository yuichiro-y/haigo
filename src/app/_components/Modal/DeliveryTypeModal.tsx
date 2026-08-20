import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  createDeliveryTypeSchema,
  type CreateDeliveryTypeInput,
} from "@/app/_lib/validation/deliveryType";

type DeliveryTypeModalProps = {
  title: string;
  submitLabel: string;
  initialValues?: CreateDeliveryTypeInput;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (
    values: CreateDeliveryTypeInput
  ) => Promise<boolean>; // 成功したかどうかを返す
};

export const DeliveryTypeModal = ({
  title,
  submitLabel,
  initialValues,
  isSaving,
  onClose,
  onSubmit,
}: DeliveryTypeModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateDeliveryTypeInput>({
    resolver: zodResolver(createDeliveryTypeSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      currentUnitPrice: initialValues?.currentUnitPrice,
    },
  });

  // フォーム送信時の処理を定義
  const submitForm = handleSubmit(async (values) => {
    const succeeded = await onSubmit(values);

    if (succeeded) {
      onClose();
    }
  });

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

        <form onSubmit={submitForm} className="space-y-4">
          <label className="block text-sm font-bold">
            サイズ名
            <input
              {...register("name")}
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
                {...register("currentUnitPrice", {
                  valueAsNumber: true,
                })}
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="185"
                disabled={isSaving}
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base font-normal outline-none disabled:opacity-50 md:text-sm"
              />
              <span className="text-sm text-muted-foreground">/ 件</span>
            </div>
          </label>

          {(errors.name || errors.currentUnitPrice) && (
            <p role="alert" className="text-sm text-destructive">
              {errors.name?.message || errors.currentUnitPrice?.message}
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