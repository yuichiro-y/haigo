"use client";

import {
  DailyRecord,
  UpdateDailyRecordInput,
  updateDailyRecordSchema,
} from "@/app/_lib/validation/dailyRecord";
import { DeliveryType } from "@/app/_lib/validation/deliveryType";
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
    <form onSubmit={handleSubmit(onSave)}>
      {deliveryTypes.map((deliveryType, index) => {
        // 配送サイズごとの数量と単価から、その行の小計を計算する
        const quantity = watchedItems[index]?.quantity;
        const safeQuantity = Number.isFinite(quantity) ? quantity : 0;

        const subtotal = deliveryType.currentUnitPrice * safeQuantity;

        return (
          <div key={deliveryType.id}>
            <div className="flex justify-between mt-2 text-center">
              <p>{deliveryType.name}</p>

              <div className="flex items-center">
                <p>¥ {deliveryType.currentUnitPrice} /件</p>
                <p className="font-bold ml-2">
                  ¥{subtotal.toLocaleString("ja-JP")}
                </p>
                <Trash2 size={16} aria-hidden="true" className="ml-2" />
              </div>
            </div>

            <div className="flex justify-between items-center px-3 ">
              <button
                type="button"
                onClick={() => changeQuantity(index, -1)}
                aria-label={`${deliveryType.name}を1件減らす`}
              >
                <Minus />
              </button>

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
                className="w-full max-w-30 text-center min-w-0 flex-1 px-3 py-3 font-bold text-9xl outline-none disabled:opacity-50 md:text-sm mt-2 items-center rounded-xl bg-primary-foreground ring-1 ring-border focus-within:ring-primary
                [appearance:textfield]
                [&::-webkit-inner-spin-button]:appearance-none
                [&::-webkit-outer-spin-button]:appearance-none"
              />

              <button
                type="button"
                onClick={() => changeQuantity(index, 1)}
                aria-label={`${deliveryType.name}を1件増やす`}
              >
                <Plus />
              </button>
            </div>
          </div>
        );
      })}

      {/* 追加された収益の数だけ、名称・金額・削除ボタンを表示する */}
      {fields.map((field, index) => (
        <div key={field.id}>
          <input
            {...register(`customRevenues.${index}.name`)}
            type="text"
            placeholder="追加収益名"
          />

          {errors.customRevenues?.[index]?.name && (
            <p role="alert">{errors.customRevenues[index]?.name?.message}</p>
          )}

          <input
            {...register(`customRevenues.${index}.amount`, {
              valueAsNumber: true,
            })}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            placeholder="金額"
          />

          {errors.customRevenues?.[index]?.amount && (
            <p role="alert">{errors.customRevenues[index]?.amount.message}</p>
          )}

          <button
            type="button"
            onClick={() => remove(index)}
            aria-label="追加収益を削除"
          >
            <Trash2 />
          </button>
        </div>
      ))}

      {/* 追加収益の入力欄を1行増やす */}
      <button
        type="button"
        onClick={() =>
          append({
            name: "",
            amount: 0,
          })
        }
      >
        追加収益を追加
      </button>

      {/* メモ欄 */}
      <div>
        <label htmlFor="memo">メモ</label>

        <textarea
          id="memo"
          {...register("memo")}
          disabled={isSubmitting}
          placeholder="今日のメモを入力"
        />
      </div>

      <p>配送売上：¥{deliveryRevenue.toLocaleString("ja-JP")}</p>

      <p>追加収益：¥{customRevenueTotal.toLocaleString("ja-JP")}</p>

      <p>本日合計：¥{totalRevenue.toLocaleString("ja-JP")}</p>

      <button type="submit" disabled={isSubmitting} className="items-center">
        {isSubmitting ? "保存中..." : dailyRecord ? "更新する" : "保存する"}
      </button>
    </form>
  );
};
