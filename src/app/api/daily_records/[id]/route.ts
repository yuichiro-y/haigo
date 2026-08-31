import { getCurrentAppUser } from "@/app/_lib/auth/getCurrentAppUser";
import { prisma } from "@/app/_lib/prisma/prisma";
import {
  dailyRecordIdSchema,
  updateDailyRecordSchema,
} from "@/app/_lib/validation/dailyRecord";
import { Prisma } from "@/generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// 日次記録の選択項目
const dailyRecordSelect = {
  id: true,
  memo: true,
  dailyRecordItems: {
    select: {
      deliveryTypeId: true,
      quantity: true,
      nameSnapshot: true,
      unitPriceSnapshot: true,
    },
  },
  customRevenues: {
    select: {
      name: true,
      amount: true,
    },
  },
} satisfies Prisma.DailyRecordSelect;

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // ログイン中のユーザーを取得する
    const appUser = await getCurrentAppUser(request);

    // ユーザーが取得できなければ401を返す
    if (!appUser) {
      return NextResponse.json(
        { message: "認証情報が確認できませんでした" },
        { status: 401 },
      );
    }
    // URLから日次記録IDを取得する
    const { id } = await context.params;
    const idResult = dailyRecordIdSchema.safeParse(id);
    // 日次記録IDが正しくない場合は400を返す
    if (!idResult.success) {
      return NextResponse.json(
        { message: "日次記録IDが正しくありません" },
        { status: 400 },
      );
    }

    // ログインユーザーが所有する日次記録かどうかを確認する
    const ownedDailyRecord = await prisma.dailyRecord.findFirst({
      where: {
        id: idResult.data,
        userId: appUser.id,
      },
      select: {
        id: true,
        dailyRecordItems: {
          select: {
            deliveryTypeId: true,
            nameSnapshot: true,
            unitPriceSnapshot: true,
          },
        },
      },
    });

    if (!ownedDailyRecord) {
      return NextResponse.json(
        { message: "日次記録が見つかりません" },
        { status: 404 },
      );
    }

    // リクエストボディを検証する
    const result = updateDailyRecordSchema.safeParse(await request.json());

    if (!result.success) {
      return NextResponse.json(
        { message: "入力内容が正しくありません" },
        { status: 400 },
      );
    }

    const {
      memo,
      dailyRecordItems,
      customRevenues,
    } = result.data;

    // 数量が1以上ある配送サイズだけを保存対象にする
    const recordedItems = dailyRecordItems.filter(
      (item) => item.quantity > 0,
    );

    const deliveryTypeIds = recordedItems.map(
      (item) => item.deliveryTypeId,
    );

    // 同じIDが複数送られていないか確認する
    if (new Set(deliveryTypeIds).size !== deliveryTypeIds.length) {
      return NextResponse.json(
        { message: "配送サイズが重複しています" },
        { status: 400 },
      );
    }

    // IDがログインユーザーのものかDBで検索
    const deliveryTypes = await prisma.deliveryType.findMany({
      where: {
        id: {
          in: deliveryTypeIds,
        },
        userId: appUser.id,
      },
      select: {
        id: true,
        name: true,
        currentUnitPrice: true,
      },
    });

    // 見つからないIDがあれば拒否する
    if (deliveryTypes.length !== deliveryTypeIds.length) {
      return NextResponse.json(
        { message: "存在しない配送サイズが含まれています" },
        { status: 400 },
      );
    }

    // 配送サイズごとに保存用のSnapshotを作る
    const dailyRecordItemsWithSnapshots = [];

    for (const item of recordedItems) {
      // 入力されたIDと一致する、DB取得済みの配送サイズを探す
      const deliveryType = deliveryTypes.find(
        (type) => type.id === item.deliveryTypeId,
      );

      // find()がundefinedの場合はSnapshotを作成できないため、存在を確認する
      if (!deliveryType) {
        return NextResponse.json(
          { message: "存在しない配送サイズが含まれています" },
          { status: 400 },
        );
      }

      // 同じ配送サイズの保存済みSnapshotを探す
      const existingItem = ownedDailyRecord.dailyRecordItems.find(
        (existing) => existing.deliveryTypeId === item.deliveryTypeId,
      );

      // 画面の数量とDBの名前・単価を組み合わせる
      dailyRecordItemsWithSnapshots.push({
        deliveryTypeId: item.deliveryTypeId,
        quantity: item.quantity,
        nameSnapshot: existingItem?.nameSnapshot ?? deliveryType.name,
        unitPriceSnapshot:
          existingItem?.unitPriceSnapshot ??
          deliveryType.currentUnitPrice,
      });
    }

    // 日次記録と関連データをまとめて更新する
    const updatedDailyRecord = await prisma.dailyRecord.update({
      where: {
        id: ownedDailyRecord.id,
      },
      data: {
        memo: memo.trim() || null,

        dailyRecordItems: {
          deleteMany: {},
          create: dailyRecordItemsWithSnapshots,
        },
        customRevenues: {
          deleteMany: {},
          create: customRevenues,
        },
      },
      select: dailyRecordSelect,
    });

    return NextResponse.json(updatedDailyRecord);
  } catch (error) {
    console.error("日次記録更新エラー:", error);

    return NextResponse.json(
      { message: "日次記録の更新に失敗しました" },
      { status: 500 },
    );
  }
}
