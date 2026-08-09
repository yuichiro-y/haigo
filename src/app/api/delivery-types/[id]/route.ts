import { getCurrentAppUser } from "@/app/_lib/auth/getCurrentAppUser";
import { prisma } from "@/app/_lib/prisma/prisma";
import { Prisma } from "@/generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";

const deliveryTypeSelect = {
  id: true,
  name: true,
  currentUnitPrice: true,
  sortOrder: true,
  isActive: true,
} satisfies Prisma.DeliveryTypeSelect;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const appUser = await getCurrentAppUser(request);

    if (!appUser) {
      return NextResponse.json(
        { message: "認証情報が確認できませんでした" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!uuidPattern.test(id)) {
      return NextResponse.json(
        { message: "配送サイズIDが正しくありません" },
        { status: 400 }
      );
    }

    const body = await parseJsonObject(request);

    if (!body) {
      return NextResponse.json(
        { message: "入力内容が正しくありません" },
        { status: 400 }
      );
    }

    const updateData: {
      name?: string;
      currentUnitPrice?: number;
      sortOrder?: number;
      isActive?: boolean;
    } = {};

    if ("name" in body) {
      if (typeof body.name !== "string") {
        return NextResponse.json(
          { message: "配送サイズ名が正しくありません" },
          { status: 400 }
        );
      }

      const trimmedName = body.name.trim();

      if (trimmedName.length === 0 || trimmedName.length > 50) {
        return NextResponse.json(
          { message: "配送サイズ名は1文字以上50文字以内で入力してください" },
          { status: 400 }
        );
      }

      updateData.name = trimmedName;
    }

    if ("currentUnitPrice" in body) {
      if (
        typeof body.currentUnitPrice !== "number" ||
        !Number.isInteger(body.currentUnitPrice) ||
        body.currentUnitPrice < 0
      ) {
        return NextResponse.json(
          { message: "単価は0以上の整数で入力してください" },
          { status: 400 }
        );
      }

      updateData.currentUnitPrice = body.currentUnitPrice;
    }

    if ("sortOrder" in body) {
      if (
        typeof body.sortOrder !== "number" ||
        !Number.isInteger(body.sortOrder) ||
        body.sortOrder < 1
      ) {
        return NextResponse.json(
          { message: "表示順は1以上の整数で入力してください" },
          { status: 400 }
        );
      }

      updateData.sortOrder = body.sortOrder;
    }

    if ("isActive" in body) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          { message: "表示状態が正しくありません" },
          { status: 400 }
        );
      }

      updateData.isActive = body.isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "更新する項目がありません" },
        { status: 400 }
      );
    }

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
        { status: 404 }
      );
    }

    const updatedDeliveryType = await prisma.deliveryType.update({
      where: {
        id: ownedDeliveryType.id,
      },
      data: updateData,
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
        { status: 409 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: "配送サイズが見つかりません" },
        { status: 404 }
      );
    }

    console.error("配送サイズ更新エラー:", error);

    return NextResponse.json(
      { message: "配送サイズの更新に失敗しました" },
      { status: 500 }
    );
  }
}
