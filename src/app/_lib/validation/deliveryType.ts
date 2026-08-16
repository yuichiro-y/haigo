import { z } from "zod";

export const deliveryTypeIdSchema = z.uuid();

// 配送サイズ登録の受付入力を定義
export const createDeliveryTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "サイズ名を入力してください" })
    .max(50, { message: "サイズ名は50文字以内で入力してください" }),
  currentUnitPrice: z
    .number({ error: "単価は数値で入力してください" })
    .int({ message: "単価は整数で入力してください" })
    .min(0, { message: "単価は0以上で入力してください" }),
});

// 配送サイズ登録の受付入力を定義
export type CreateDeliveryTypeInput = z.infer<
  typeof createDeliveryTypeSchema
>;

// 配送サイズ更新の受付入力を定義
export const updateDeliveryTypeSchema = createDeliveryTypeSchema
  // 表示状態フィールドを追加
  .extend({
    isActive: z.boolean(),
  })
  .partial() // 全てのフィールドを任意にする
  // 更新する項目が1つ以上あることを検証
  .refine((data) => Object.keys(data).length > 0, {
    message: "更新する項目がありません",
  });

// 配送サイズ更新の受付入力を定義
export type UpdateDeliveryTypeInput = z.infer<
  typeof updateDeliveryTypeSchema
>;

// 配送サイズの型を定義
export const deliveryTypeSchema = createDeliveryTypeSchema.extend({
  id: deliveryTypeIdSchema, // 配送サイズIDを追加
  sortOrder: z.number().int().min(1), // 並び順を追加
  isActive: z.boolean(), // 表示状態を追加
});

// 配送サイズの配列を定義
export const deliveryTypesSchema = z.array(deliveryTypeSchema);
// 配送サイズの型を定義
export type DeliveryType = z.infer<typeof deliveryTypeSchema>;