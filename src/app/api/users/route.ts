import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma/prisma";
import { supabase } from "@/app/_lib/supabase/client";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json({ message: "認証情報がありません" },{ status: 401 });
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user?.email) {
      return NextResponse.json({ message: "ユーザーを確認できませんでした" }, { status: 401 });    
    }

    const appUser = await prisma.user.upsert({
      where: {
        supabaseUserId: user.id,
      },
      update: {
        email: user.email,
      },
      create: {
        email: user.email,
        supabaseUserId: user.id,
      },
    });

    return NextResponse.json(appUser, { status: 201 });
  } catch (error) {
    console.error("ユーザー登録エラー:", error);
    
    return NextResponse.json({ message: "ユーザー登録に失敗しました" }, { status: 500 });
  }
}