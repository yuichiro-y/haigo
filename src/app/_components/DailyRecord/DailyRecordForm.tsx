"use client";

import {
  DailyRecord,
  UpdateDailyRecordInput,
  updateDailyRecordSchema,
} from "@/app/_lib/validation/dailyRecord";
import { DeliveryType } from "@/app/_lib/validation/deliveryType";
import { zodResolver } from "@hookform/resolvers/zod";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

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

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    control,
    formState: { isSubmitting },
  } = useForm<UpdateDailyRecordInput>({
    resolver: zodResolver(updateDailyRecordSchema),
    defaultValues,
  });

  // 合計表示
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

  const watchedItems = useWatch({
    control,
    name: "dailyRecordItems",
  });

  const deliveryRevenue = deliveryTypes.reduce((total, deliveryType, index) => {
    const quantity = watchedItems[index]?.quantity;

    const safeQuantity = Number.isFinite(quantity) ? quantity : 0;

    return total + deliveryType.currentUnitPrice * safeQuantity;
  }, 0);

  return (
    <form onSubmit={handleSubmit(onSave)}>
      {deliveryTypes.map((deliveryType, index) => {
        // 小計表示
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

      <p>配送売上合計： ¥{deliveryRevenue.toLocaleString("ja-JP")}</p>

      <button type="submit" disabled={isSubmitting} className="items-center">
        {isSubmitting ? "保存中..." : dailyRecord ? "更新する" : "保存する"}
      </button>
    </form>
  );
};
