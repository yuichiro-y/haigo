import { z } from "zod";

// URLから受け取る日次記録IDがUUID形式か検証する
export const dailyRecordIdSchema = z.uuid();

// 日次記録を新規作成するとき、画面からAPIへ送る入力を定義する
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
      name: z.string().trim().min(1, {
        message: "追加収益名を入力してください",
      }),
      amount: z
        .number({
          error: "金額を入力してください",
        })
        .int({
          message: "金額は整数で入力してください",
        })
        .min(1, {
          message: "金額は1円以上で入力してください",
        }),
    }),
  ),
});

// 新規作成APIへ送る入力のTypeScript型をZodスキーマから作る
export type CreateDailyRecordInput = z.infer<typeof createDailyRecordSchema>;

// 更新では日付を変更しないため、新規作成用スキーマからworkDateを除外する
export const updateDailyRecordSchema = createDailyRecordSchema.omit({
  workDate: true,
});

// 更新APIへ送る入力のTypeScript型をZodスキーマから作る
export type UpdateDailyRecordInput = z.infer<typeof updateDailyRecordSchema>;

// APIから返る配送明細。保存時点の名称と単価もSnapshotとして含む
const dailyRecordItemSchema = z.object({
  deliveryTypeId: z.uuid(),
  quantity: z.number().int().min(1),
  nameSnapshot: z.string(),
  unitPriceSnapshot: z.number().int().min(1),
});

// GET・POST・PATCHの日次記録APIから返る1日分のデータを定義する
export const dailyRecordSchema = z.object({
  id: dailyRecordIdSchema,
  // DBではメモを入力しなかった場合にnullで保存される
  memo: z.string().nullable(),
  dailyRecordItems: z.array(dailyRecordItemSchema),
  customRevenues: z.array(
    z.object({
      name: z.string(),
      amount: z.number().int().min(1),
    }),
  ),
});

// 日次記録APIから受け取るデータのTypeScript型をZodスキーマから作る
export type DailyRecord = z.infer<typeof dailyRecordSchema>;
