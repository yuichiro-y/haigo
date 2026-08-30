import { getCurrentAppUser } from "@/app/_lib/auth/getCurrentAppUser";
import { prisma } from "@/app/_lib/prisma/prisma";
import { dailyRecordIdSchema, updateDailyRecordSchema } from "@/app/_lib/validation/dailyRecord";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

    // リクエストボディを検証する
    const result = updateDailyRecordSchema.safeParse(await request.json());

    if (!result.success) {
      return NextResponse.json(
        { message: "入力内容が正しくありません" },
        { status: 400 },
      );
    }

    const ownedDailyRecord = await prisma.dailyRecord.findFirst({
      where: {
        id: idResult.data,
        userId: appUser.id,
      },
      select: {
        id: true,
      },
    });

    if (!ownedDailyRecord) {
      return NextResponse.json(
        { message: "今日の記録データが見つかりません" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "日次記録の更新処理は未実装です" },
      { status: 501 },
    );

  } catch(error) {
    console.error("日次記録更新エラー:", error);

    return NextResponse.json(
      { message: "日次記録の更新に失敗しました" },
      { status: 500 },
    );
  }
}