import { NextRequest, NextResponse } from "next/server";
import { getCurrentAppUser } from "@/app/_lib/auth/getCurrentAppUser";
import { prisma } from "@/app/_lib/prisma/prisma";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";

// 配送サイズ登録の受付入力を定義
const createDeliveryTypeSchema = z.object({
  name: z.string().trim().min(1).max(50),
  currentUnitPrice: z.number().int().min(0),
});

const deliveryTypeSelect = {
  id: true,
  name: true,
  currentUnitPrice: true,
  sortOrder: true,
  isActive: true,
} satisfies Prisma.DeliveryTypeSelect;

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
    // 設定画面：非表示にしたサイズを再表示できるように全件取得
    // 配送記録画面：使用中のサイズだけを取得する
    const includeInactive =
      request.nextUrl.searchParams.get("includeInactive") === "true";

    // ログインユーザーの配送サイズを表示順に取得する
    const deliveryTypes = await prisma.deliveryType.findMany({
      where: {
        userId: appUser.id,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: deliveryTypeSelect,
    });
    // 配送サイズ一覧をJSONで返す
    return NextResponse.json(deliveryTypes);
  } catch (error) {
    // 想定外のエラーは500で返す
    console.error("配送サイズ一覧取得エラー:", error);

    return NextResponse.json(
      { message: "配送サイズ一覧の取得に失敗しました" },
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
    // json格納
    const body: unknown = await request.json().catch(() => null);
    // リクエスト本文の型と値を検証
    const result = createDeliveryTypeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "入力内容が正しくありません" },
        { status: 400 },
      );
    }

    // 検証済みのサイズ名と単価を取り出す
    const { name, currentUnitPrice } = result.data;

    const lastDeliveryType = await prisma.deliveryType.findFirst({
      where: {
        userId: appUser.id,
      },
      orderBy: {
        sortOrder: "desc",
      },
      select: {
        sortOrder: true,
      },
    });

    const deliveryType = await prisma.deliveryType.create({
      data: {
        userId: appUser.id,
        name,
        currentUnitPrice,
        sortOrder: (lastDeliveryType?.sortOrder ?? 0) + 1,
        isActive: true,
      },
      select: deliveryTypeSelect,
    });

    return NextResponse.json(deliveryType, { status: 201 });
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

    console.error("配送サイズ登録エラー:", error);

    return NextResponse.json(
      { message: "配送サイズの登録に失敗しました" },
      { status: 500 },
    );
  }
}
