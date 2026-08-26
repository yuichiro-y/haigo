import { NextRequest, NextResponse } from "next/server";
import { getCurrentAppUser } from "@/app/_lib/auth/getCurrentAppUser";
import { prisma } from "@/app/_lib/prisma/prisma";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";

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
