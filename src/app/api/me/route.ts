import { NextRequest, NextResponse } from "next/server";
import { getCurrentAppUser } from "@/app/_lib/auth/getCurrentAppUser";
import type { AppUser } from "@/app/_types/appUser";

export async function GET(request: NextRequest) {
  try {
    const appUser = await getCurrentAppUser(request);

    if (!appUser) {
      return NextResponse.json(
        { message: "認証されたユーザーを取得できませんでした" },
        { status: 401 },
      );
    }

    return NextResponse.json<AppUser>({
      email: appUser.email,
    });
  } catch (error) {
    console.error("ユーザー取得エラー:", error);

    return NextResponse.json(
      { message: "ユーザー情報の取得に失敗しました" },
      { status: 500 },
    );
  }
}
