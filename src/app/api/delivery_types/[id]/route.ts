import { NextRequest, NextResponse } from "next/server";
import { getCurrentAppUser } from "@/app/_lib/auth/getCurrentAppUser";
import { prisma } from "@/app/_lib/prisma/prisma";
import { Prisma } from "@/generated/prisma/client";
import { deliveryTypeIdSchema,
  updateDeliveryTypeSchema,
} from "@/app/_lib/validation/deliveryType";

const deliveryTypeSelect = {
  id: true,
  name: true,
  currentUnitPrice: true,
  sortOrder: true,
  isActive: true,
} satisfies Prisma.DeliveryTypeSelect;

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
    // URLから配送サイズIDを取得する
    const { id } = await context.params;
    // 配送サイズIDがUUID形式であることを検証する
    const idResult = deliveryTypeIdSchema.safeParse(id);
    // 配送サイズIDが正しくない場合は400を返す
    if (!idResult.success) {
      return NextResponse.json(
        { message: "配送サイズIDが正しくありません" },
        { status: 400 },
      );
    }

    // リクエストボディを検証する
    const result = updateDeliveryTypeSchema.safeParse(
      await request.json(),
    );

    if (!result.success) {
      return NextResponse.json(
        { message: "入力内容が正しくありません" },
        { status: 400 },
      );
    }

    // ログインユーザーが所有する配送サイズかどうかを確認する
    const ownedDeliveryType = await prisma.deliveryType.findFirst({
      where: {
        id,
        userId: appUser.id,
      },
      select: {
        id: true,
      },
    });

    if (!ownedDeliveryType) {
      return NextResponse.json(
        { message: "配送サイズが見つかりません" },
        { status: 404 },
      );
    }
    // 確認済みIDを使って更新する
    const updatedDeliveryType = await prisma.deliveryType.update({
      where: {
        id: ownedDeliveryType.id,
      },
      data: result.data,
      select: deliveryTypeSelect,
    });

    return NextResponse.json(updatedDeliveryType);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "同じ名前の配送サイズがすでに登録されています" },
        { status: 409 },
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: "配送サイズが見つかりません" },
        { status: 404 },
      );
    }

    console.error("配送サイズ更新エラー:", error);

    return NextResponse.json(
      { message: "配送サイズの更新に失敗しました" },
      { status: 500 },
    );
  }
}
