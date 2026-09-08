"use client";

import {
  DailyRecord,
  UpdateDailyRecordInput,
  updateDailyRecordSchema,
} from "@/app/_lib/validation/dailyRecord";
import { DeliveryType } from "@/app/_lib/validation/deliveryType";
import { Button } from "@/app/_components/Button/Button";
import { Input } from "@/app/_components/Input/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

type DailyRecordFormProps = {
  deliveryTypes: DeliveryType[];
  dailyRecord: DailyRecord | null;
  onSave: (values: UpdateDailyRecordInput) => Promise<boolean>;
};

export const DailyRecordForm = ({
  deliveryTypes,
  dailyRecord,
  onSave,
}: DailyRecordFormProps) => {
  // 配送サイズ一覧と保存済み記録から、フォームに表示する初期値を作る
  const defaultValues: UpdateDailyRecordInput = {
    memo: dailyRecord?.memo ?? "",
    dailyRecordItems: deliveryTypes.map((deliveryType) => ({
      deliveryTypeId: deliveryType.id,
      quantity:
        dailyRecord?.dailyRecordItems.find(
          (item) => item.deliveryTypeId === deliveryType.id,
        )?.quantity ?? 0,
    })),
    customRevenues: dailyRecord?.customRevenues ?? [],
  };

  // 入力値の管理とZodによる送信前の検証を設定する
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UpdateDailyRecordInput>({
    resolver: zodResolver(updateDailyRecordSchema),
    defaultValues,
  });

  // ユーザーが自由に追加・削除できる追加収益欄を管理する
  const { fields, append, remove } = useFieldArray({
    control,
    name: "customRevenues",
  });

  // ＋－ボタンで数量を変更し、0件未満にならないようにする
  const changeQuantity = (index: number, difference: number) => {
    const currentQuantity = getValues(`dailyRecordItems.${index}.quantity`);
    const safeQuantity = Number.isFinite(currentQuantity) ? currentQuantity : 0;

    setValue(
      `dailyRecordItems.${index}.quantity`,
      Math.max(0, safeQuantity + difference),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  // 数量の変更を監視し、小計と配送売上をリアルタイムで再計算する
  const watchedItems = useWatch({
    control,
    name: "dailyRecordItems",
  });

  const deliveryRevenue = deliveryTypes.reduce((total, deliveryType, index) => {
    const quantity = watchedItems[index]?.quantity;

    const safeQuantity = Number.isFinite(quantity) ? quantity : 0;

    return total + deliveryType.currentUnitPrice * safeQuantity;
  }, 0);

  // 追加収益の変更を監視し、追加収益合計をリアルタイムで再計算する
  const watchedCustomRevenues = useWatch({
    control,
    name: "customRevenues",
  });

  const customRevenueTotal = (watchedCustomRevenues ?? []).reduce(
    (total, customRevenue) => {
      const amount = customRevenue?.amount;

      return total + (Number.isFinite(amount) ? amount : 0);
    },
    0,
  );

  // 配送売上と追加収益を合算して、本日の売上合計を作る
  const totalRevenue = deliveryRevenue + customRevenueTotal;

  return (
    <form className="space-y-3 pb-4" onSubmit={handleSubmit(onSave)}>
      {deliveryTypes.map((deliveryType, index) => {
        // 配送サイズごとの数量と単価から、その行の小計を計算する
        const quantity = watchedItems[index]?.quantity;
        const safeQuantity = Number.isFinite(quantity) ? quantity : 0;

        const subtotal = deliveryType.currentUnitPrice * safeQuantity;

        return (
          <div
            key={deliveryType.id}
            className={`rounded-xl border-2 p-4 shadow-sm transition-colors ${
              safeQuantity > 0
                ? "border-primary/40 bg-secondary"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 border-b border-dashed border-border pb-1 text-sm font-bold">
                {deliveryType.name}
              </p>

              <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                <span>¥</span>
                <span className="min-w-16 rounded-full bg-muted px-3 py-1 text-center font-bold text-foreground">
                  {deliveryType.currentUnitPrice.toLocaleString("ja-JP")}
                </span>
                <span>/件</span>
                <p className="font-semibold text-primary">
                  ¥{subtotal.toLocaleString("ja-JP")}
                </p>
                <Trash2
                  size={15}
                  aria-hidden="true"
                  className="ml-0.5 text-muted-foreground"
                />
              </div>
            </div>

            <div className="mt-3 flex h-14 items-center justify-between">
              <Button
                type="button"
                variant="secondary"
                onClick={() => changeQuantity(index, -1)}
                aria-label={`${deliveryType.name}を1件減らす`}
                className="size-13 rounded-xl"
              >
                <Minus size={22} aria-hidden="true" />
              </Button>

              <input
                type="hidden"
                {...register(`dailyRecordItems.${index}.deliveryTypeId`)}
              />
              <input
                {...register(`dailyRecordItems.${index}.quantity`, {
                  valueAsNumber: true,
                })}
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                className={`w-24 bg-transparent px-3 py-2 text-center text-3xl font-bold outline-none disabled:opacity-50 ${
                  safeQuantity > 0 ? "text-primary" : "text-muted-foreground/30"
                }
                [appearance:textfield]
                [&::-webkit-inner-spin-button]:appearance-none
                [&::-webkit-outer-spin-button]:appearance-none`}
              />

              <Button
                type="button"
                onClick={() => changeQuantity(index, 1)}
                aria-label={`${deliveryType.name}を1件増やす`}
                className="size-13 rounded-xl"
              >
                <Plus size={22} aria-hidden="true" />
              </Button>
            </div>
          </div>
        );
      })}

      {/* 追加された収益の数だけ、名称・金額・削除ボタンを表示する */}
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="rounded-xl border border-border bg-card p-3 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Input
              {...register(`customRevenues.${index}.name`)}
              type="text"
              placeholder="追加収益名"
              className="min-w-0 flex-1"
            />

            <span className="text-sm text-muted-foreground">¥</span>
            <Input
              {...register(`customRevenues.${index}.amount`, {
                valueAsNumber: true,
              })}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              placeholder="金額"
              className="w-24 text-right font-bold"
            />

            <Button
              type="button"
              variant="ghost"
              onClick={() => remove(index)}
              aria-label="追加収益を削除"
              className="size-9 shrink-0 rounded-lg"
            >
              <Trash2 size={17} aria-hidden="true" />
            </Button>
          </div>

          {errors.customRevenues?.[index]?.name && (
            <p className="mt-2 text-xs text-destructive" role="alert">
              {errors.customRevenues[index]?.name?.message}
            </p>
          )}

          {errors.customRevenues?.[index]?.amount && (
            <p className="mt-2 text-xs text-destructive" role="alert">
              {errors.customRevenues[index]?.amount.message}
            </p>
          )}
        </div>
      ))}

      {/* 追加収益の入力欄を1行増やす */}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          append({
            name: "",
            amount: 0,
          })
        }
        className="w-full gap-1 rounded-xl px-4 py-3 text-sm font-medium"
      >
        <Plus size={16} aria-hidden="true" />
        追加収益を追加
      </Button>

      {/* メモ欄 */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <label
          htmlFor="memo"
          className="mb-2 block text-xs font-medium text-muted-foreground"
        >
          メモ
        </label>

        <textarea
          id="memo"
          {...register("memo")}
          disabled={isSubmitting}
          placeholder="今日のメモを入力"
          rows={3}
          className="w-full resize-none bg-transparent text-base md:text-sm outline-none placeholder:text-border disabled:opacity-50"
        />
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="space-y-1 text-xs text-muted-foreground">
          <p className="flex items-center justify-between">
            <span>配送売上</span>
            <span>¥{deliveryRevenue.toLocaleString("ja-JP")}</span>
          </p>

          <p className="flex items-center justify-between">
            <span>追加収益</span>
            <span>¥{customRevenueTotal.toLocaleString("ja-JP")}</span>
          </p>
        </div>

        <p className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">本日合計</span>
          <span className="text-2xl font-bold text-primary">
            ¥{totalRevenue.toLocaleString("ja-JP")}
          </span>
        </p>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-3 w-full rounded-xl px-4 py-3.5 text-sm font-bold"
        >
          {isSubmitting ? "保存中..." : dailyRecord ? "更新する" : "保存する"}
        </Button>
      </div>
    </form>
  );
};
