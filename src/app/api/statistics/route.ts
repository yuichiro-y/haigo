import { getCurrentAppUser } from "@/app/_lib/auth/getCurrentAppUser";
import { prisma } from "@/app/_lib/prisma/prisma";
import {
  StatisticsDay,
  StatisticsResponse,
} from "@/app/_types/statistics";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const appUser = await getCurrentAppUser(request);

    if (!appUser) {
      return NextResponse.json(
        {message: "認証情報が取得できませんでした"},
        {status: 401},
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
            deliveryTypeId: true,
            quantity: true,
            unitPriceSnapshot: true,
            deliveryType: {
              select: {
                name: true,
              },
            },
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
    const statisticsDays = dailyRecords.map((record) => {
      // 数量 × 単価をすべて合計
      const totalRevenue =
        record.dailyRecordItems.reduce(
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
        totalRevenue: totalRevenue + customRevenue,
      };
    });

    // 月間総収益を計算する
    const monthlyRevenue = statisticsDays.reduce(
      (total, day) => total + day.totalRevenue,
      0,
    );

    // 営業日数は、総収益が0より大きい日をカウントする
    const operatingDays = statisticsDays.filter(
      (day) => day.totalRevenue > 0,
    ).length;

    // 1日あたり平均収益は、営業日数が0より大きい場合に計算する
    const averageDay = operatingDays > 0
      ? monthlyRevenue / operatingDays
      : 0;

    const deliveryTypesTotal = dailyRecords
      .flatMap((record) => record.dailyRecordItems)
      .reduce<Record<string,{name: string, quantity: number}>>((total, item) => {
        const id = item.deliveryTypeId;
        const existing = total[id];

        if (existing) {
          // 集計済みなら、今回の個数を足す
          existing.quantity += item.quantity;
        } else {
          // 初登場なら、集計欄を作る
          total[id] = {
            name: item.deliveryType.name,
            quantity: item.quantity,
          };
        }
        return total;
      }, {});

    const highestRevenueDay = statisticsDays.reduce<
      StatisticsDay | null
    >((maxDay, nextDay) => {
      if (maxDay === null) {
        return nextDay;
      }

      if (maxDay.totalRevenue < nextDay.totalRevenue) {
        return nextDay;
      }

      return maxDay;
    }, null);

    // 月間統計のレスポンス作成
    const response: StatisticsResponse = {
      monthlyRevenue,
      operatingDays,
      averageDay,
      days: statisticsDays,
      deliveryTypesTotal,
      highestRevenueDay,
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("統計情報取得エラー", error);

    return NextResponse.json(
      { message: "統計情報の取得に失敗しました" },
      { status: 500 },
    );
  }
}