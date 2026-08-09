"use client";

import { supabase } from "@/app/_lib/supabase/client";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const authFetch = async <T>(
  input: RequestInfo | URL,
  init: RequestInit = {}
) => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new ApiError("ログインが必要です", 401);
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${session.access_token}`);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    // JSONを返さないエラーでも、HTTPステータスを使って処理を続ける。
  }

  if (!response.ok) {
    const message =
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : "通信に失敗しました";

    throw new ApiError(message, response.status);
  }

  return body as T;
};
