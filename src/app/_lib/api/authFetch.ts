"use client";

import { supabase } from "@/app/_lib/supabase/client";
// authFetchは、Supabaseのセッションを使用して認証付きのfetchリクエストを行う関数です。
export const authFetch = async <T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<T> => {
  // Supabaseのセッションを取得する
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  // セッションが取得できない場合はエラーを投げる
  if (error || !session?.access_token) {
    throw new Error("ログインが必要です");
  }

  // AuthorizationヘッダーにBearerトークンを設定する
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${session.access_token}`);

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = await response.json();
    // エラーレスポンスの形式が想定と異なる場合は、汎用的なエラーを投げる
    if (
      !body ||
      typeof body !== "object" ||
      !("message" in body) ||
      typeof body.message !== "string"
    ) {
      throw new Error("通信に失敗しました");
    }

    throw new Error(body.message);
  }

  return response.json();
};
