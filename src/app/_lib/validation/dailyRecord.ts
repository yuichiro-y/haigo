import { z } from "zod";

export const createDailyRecordSchema = z.object({
  // 日付がYYYY-MM-DD形式であることを検証する
  workDate: z.iso.date(),
  memo: z.string(),
  // 日次記録のアイテムは配列で、各アイテムはオブジェクト
  dailyRecordItems: z.array(
    z.object({
      deliveryTypeId: z.uuid(),
      quantity: z.number().int().min(0),
    }),
  ),
  // カスタム収益は配列で、各収益はオブジェクト
  customRevenues: z.array(
    z.object({
      name: z.string().trim().min(1),
      amount: z.number().int().min(0),
    }),
  ),
});

export type CreateDailyRecordInput = z.infer<
  typeof createDailyRecordSchema
>;