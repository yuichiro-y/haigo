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

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.message);
  }

  return body;
};
