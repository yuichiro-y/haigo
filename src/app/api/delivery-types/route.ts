import { NextRequest, NextResponse } from "next/server";
import { getCurrentAppUser } from "@/app/_lib/auth/getCurrentAppUser";
import { prisma } from "@/app/_lib/prisma/prisma";
import { Prisma } from "@/generated/prisma/client";

const deliveryTypeSelect = {
  id: true,
  name: true,
  currentUnitPrice: true,
  sortOrder: true,
  isActive: true,
} satisfies Prisma.DeliveryTypeSelect;

const parseJsonObject = async (request: NextRequest) => {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return null;
    }

    return body as Record<string, unknown>;
  } catch {
    return null;
  }
};

export async function GET(request: NextRequest) {
  try {
    const appUser = await getCurrentAppUser(request);

    if (!appUser) {
      return NextResponse.json(
        { message: "認証情報が取得できませんでした" },
        { status: 401 }
      );
    }

    const includeInactive =
      request.nextUrl.searchParams.get("includeInactive") === "true";

    const deliveryTypes = await prisma.deliveryType.findMany({
      where: {
        userId: appUser.id,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
      select: deliveryTypeSelect,
    });

    return NextResponse.json(deliveryTypes);
  } catch (error) {
    console.error("配送サイズ一覧取得エラー:", error);

    return NextResponse.json({ message: "配送サイズ一覧の取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const appUser = await getCurrentAppUser(request);

    if (!appUser) {
      return NextResponse.json({ message: "認証情報が確認できませんでした" }, { status: 401 });
    }

    const body = await parseJsonObject(request);

    if (!body) {
      return NextResponse.json(
        { message: "入力内容が正しくありません" },
        { status: 400 }
      );
    }

    const { name, currentUnitPrice, sortOrder } = body;

    if (
      typeof name !== "string" ||
      typeof currentUnitPrice !== "number" ||
      typeof sortOrder !== "number"
    ) {
      return NextResponse.json(
        { message: "入力内容が正しくありません" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    if (
      trimmedName.length === 0 ||
      trimmedName.length > 50 ||
      !Number.isInteger(currentUnitPrice) ||
      currentUnitPrice < 0 ||
      !Number.isInteger(sortOrder) ||
      sortOrder < 1
    ) {
      return NextResponse.json(
        { message: "入力内容が正しくありません" },
        { status: 400 }
      );
    }

    const deliveryType = await prisma.deliveryType.create({
      data: {
        userId: appUser.id,
        name: trimmedName,
        currentUnitPrice,
        sortOrder,
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
        { status: 409 }
      );
    }

    console.error("配送サイズ登録エラー:", error);

    return NextResponse.json(
      { message: "配送サイズの登録に失敗しました" },
      { status: 500 }
    );
  }
}
