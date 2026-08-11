import { z } from "zod";

// 配送サイズ登録の受付入力を定義
export const createDeliveryTypeSchema = z.object({
  name: z.string().trim().min(1).max(50),
  currentUnitPrice: z.number().int().min(0),
});

export type CreateDeliveryTypeInput = z.infer<
  typeof createDeliveryTypeSchema
>;