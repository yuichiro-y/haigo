import { NextRequest, NextResponse } from "next/server";
import { getCurrentAppUser } from "@/app/_lib/auth/getCurrentAppUser";
import { prisma } from "@/app/_lib/prisma/prisma";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { createDailyRecordSchema } from "@/app/_lib/validation/dailyRecord";

// 日次記録の選択項目
const dailyRecordSelect = {
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

export async function GET(request: NextRequest) {
  try {
    // ログイン中のユーザーを取得する
    const appUser = await getCurrentAppUser(request);

    // ユーザーが取得できなければ401を返す
    if (!appUser) {
      return NextResponse.json(
        { message: "認証情報が取得できませんでした" },
        { status: 401 },
      );
    }

    // 日付のパラメータを取得する
    const dateResult = z.iso.date().safeParse(
      request.nextUrl.searchParams.get("date"),
    );

    // 日付が正しくない場合は400を返す
    if (!dateResult.success) {
      return NextResponse.json(
        { message: "日付が正しくありません" },
        { status: 400 },
      );
    }

    // 日付をUTCの00:00:00に変換する
    const workDate = new Date(`${dateResult.data}T00:00:00.000Z`);

    // 今日の記録を取得する。記録がない場合はnullを返す
    const dailyRecord = await prisma.dailyRecord.findUnique({
      where: {
        userId_workDate: {
          userId: appUser.id,
          workDate,
        },
      },
      select: dailyRecordSelect,
    });

    // 今日の記録をJSONで返す
    return NextResponse.json(dailyRecord);
  } catch (error) {
    // 想定外のエラーは500で返す
    console.error("今日の記録取得エラー:", error);

    return NextResponse.json(
      { message: "今日の記録の取得に失敗しました" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // ログイン中のユーザーを取得する
    const appUser = await getCurrentAppUser(request);

    if (!appUser) {
      return NextResponse.json(
        { message: "認証情報が確認できませんでした" },
        { status: 401 },
      );
    }

    // リクエストをdailyRecordスキーマで検証する
    const result = createDailyRecordSchema.safeParse(await request.json());

    if (!result.success) {
      return NextResponse.json(
        { message: "入力内容が正しくありません" },
        { status: 400 },
      );
    }

    // 検証済みの内容を取り出す
    const {
      workDate: workDateString,
      memo,
      dailyRecordItems,
      customRevenues,
    } = result.data;

    // DB保存用の日付へ変換する
    const workDate = new Date(`${workDateString}T00:00:00.000Z`);

    // 各入力から配送サイズIDだけ取り出す
    const deliveryTypeIds = dailyRecordItems.map(
      (item) => item.deliveryTypeId,
    );

    // ID重複検査
    if (new Set(deliveryTypeIds).size !== deliveryTypeIds.length) {
      return NextResponse.json(
        { message: "同じ配達種別が重複しています" },
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
        { message: "存在しない配達種別が含まれています" },
        { status: 400 },
      );
    }

    // 配送サイズごとに保存用のSnapshotを作る
    const dailyRecordItemsWithSnapshot = [];

    for (const item of dailyRecordItems) {
      // 入力されたIDと一致する、DB取得済みの配送サイズを探す
      const deliveryType = deliveryTypes.find(
        (type) => type.id === item.deliveryTypeId,
      );

      // 直前に件数確認済みだが、念のため存在確認
      if (!deliveryType) {
        return NextResponse.json(
          { message: "存在しない配達種別が含まれています" },
          { status: 400 },
        );
      }

      // 画面の数量とDBの名前・単価を組み合わせる
      dailyRecordItemsWithSnapshot.push({
        deliveryTypeId: item.deliveryTypeId,
        quantity: item.quantity,
        nameSnapshot: deliveryType.name,
        unitPriceSnapshot: deliveryType.currentUnitPrice,
      });
    }

    return NextResponse.json(
      { message: "日次記録の作成はまだ実装されていません" },
      { status: 501 },
    );
  } catch (error) {
    // 想定外のエラーは500で返す
    console.error("日次記録作成エラー:", error);

    return NextResponse.json(
      { message: "日次記録の作成に失敗しました" },
      { status: 500 },
    );
  }
}