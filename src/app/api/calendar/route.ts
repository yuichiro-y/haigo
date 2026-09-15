import { getCurrentAppUser } from "@/app/_lib/auth/getCurrentAppUser";
import { prisma } from "@/app/_lib/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    //
    const appUser = await getCurrentAppUser(request);

    if (!appUser) {
      return NextResponse.json(
        { message: "認証情報が取得できませんでした" },
        { status: 401 },
      );
    }

    const monthResult = z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
      .safeParse(request.nextUrl.searchParams.get("month"));

    if (!monthResult.success) {
      return NextResponse.json(
        { message: "年月が正しくありません" },
        { status: 400 },
      );
    }

    const [year, monthNumber] = monthResult.data.split("-").map(Number);

    const startDate = new Date(Date.UTC(year, monthNumber - 1, 1));
    const nextMonthStart = new Date(Date.UTC(year, monthNumber, 1));

    // 1か月分の日次記録を取得
    const dailyRecords = await prisma.dailyRecord.findMany({
      where: {
        userId: appUser.id,
        workDate: {
          gte: startDate,
          lt: nextMonthStart,
        },
      },
      select: {
        workDate: true,
        dailyRecordItems: {
          select: {
            quantity: true,
            unitPriceSnapshot: true,
          },
        },
        customRevenues: {
          select: {
            amount: true,
          },
        },
      },
      orderBy: {
        workDate: "asc",
      },
    });

    // 日ごとの表示データへ変換
    const calendarDays = dailyRecords.map((record) => {
      // 数量 × 単価をすべて合計
      const deliveryRevenue = record.dailyRecordItems.reduce(
        (total, item) => total + item.quantity * item.unitPriceSnapshot,
        0,
      );

      // 追加収益をすべて合計
      const customRevenue = record.customRevenues.reduce(
        (total, revenue) => total + revenue.amount,
        0,
      );

      return {
        workDate: record.workDate.toISOString().slice(0, 10),
        totalRevenue: deliveryRevenue + customRevenue,
      };
    });

    const monthlyRevenue = calendarDays.reduce(
      (total, day) => total + day.totalRevenue,
      0,
    );

    const operatingDays = calendarDays.filter(
      (day) => day.totalRevenue > 0,
    ).length;

    //  日付と総収益だけ返す
    return NextResponse.json({
      monthlyRevenue,
      operatingDays,
      days: calendarDays,
    });
  } catch (error) {
    console.error("カレンダー取得エラー", error);

    return NextResponse.json(
      { message: "カレンダーの取得に失敗しました" },
      { status: 500 },
    );
  }
}
