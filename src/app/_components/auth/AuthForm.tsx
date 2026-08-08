"use client";

import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, CircleCheck } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/app/_lib/supabase/client";
import { useRouter } from "next/navigation";

type AuthMode = "signUp" | "login";

export type AuthFormValues = {
  email: string;
  password: string;
  passwordConfirm?: string;
}

type AuthFormProps = {
  mode: AuthMode;
};

const authContent = {
  signUp: {
    title: '新規登録',
    description: 'HAIGOに参加して収益管理を始めましょう',
    submitLabel: '登録する',
    footerText: 'すでにアカウントをお持ちの方は',
    footerLinkLabel: 'ログイン',
    footerLinkHref: '/login',
  },
  login: {
    title: 'おかえりなさい',
    description: 'アカウントにログインしてください',
    submitLabel: 'ログイン',
    footerText: 'アカウントをお持ちでない方は',
    footerLinkLabel: '新規登録',
    footerLinkHref: '/sign_up',
  },
};

const syncAppUser = async (accessToken: string) => {
  try {  
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return false;
    }
    
    return true;
    } catch (error) {
      console.error("ユーザー登録に失敗しました:", error);
      return false;
    }
};

export const AuthForm = ({ mode }: AuthFormProps) => {
  const router = useRouter();
  const content = authContent[mode];
  const [showPassword, setShowPassword] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState:{ errors, isSubmitting },
  } = useForm<AuthFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const onSubmit = async (values: AuthFormValues) => {
    setSubmitSuccess("");
    clearErrors("root.auth");

    if (mode === "signUp") {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo:
            `${process.env.NEXT_PUBLIC_APP_URL}/login`,
        },        
      });

      if (error) {
        console.error("Supabase Auth登録失敗:",error.message);

        setError("root.auth", {
          type: "server",
          message: "新規登録に失敗しました",
        });

        return;
      }

      const accessToken = data.session?.access_token;
      if (!accessToken) {
        console.log("メール確認後にpublic.usersへ登録します");
        setSubmitSuccess("確認メールを送信しました。");

        return;
      }

      const syncSucceeded = await syncAppUser(accessToken);

      if (!syncSucceeded) {
        setError("root.auth", {
          type: "server",
          message: "ユーザー情報の登録に失敗しました",
        });
        
        return;
      }

      console.log("ユーザー登録成功");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        console.error("ログイン失敗:",error.message);

        setError("root.auth", {
          type: "server",
          message:"メールアドレスまたはパスワードを確認してください",
        });

        return;
      }

      const accessToken = data.session?.access_token;
      if (!accessToken) {
        console.log("ログインセッションを取得できませんでした");
        
        return;
      }
      
      const syncSucceeded = await syncAppUser(accessToken);

      if (!syncSucceeded) {
        setError("root.auth", {
          type: "server",
          message: "ユーザー情報の登録に失敗しました",
        });

        return;
      }

      console.log("ログイン成功");
      router.replace("/");
    }
  }

  return (
    <>
      <div className="max-w-90 w-full flex flex-col mx-auto">
        <div className="mb-3">
          <h1 className="font-extrabold text-2xl mb-0.5">
            {content.title}
          </h1>
          <p className="text-[#6B7280]">{content.description}</p>
        </div>

        <form 
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5 mb-5"
        >
          <div className="flex flex-col gap-3">
            <div>
              <label htmlFor="email" className="font-bold text-sm">
                メールアドレス
              </label>
              <div className="relative">
                <Mail
                size={18}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input 
                  id="email"
                  type="email"
                  disabled={isSubmitting}
                  {...register("email", {
                    required: "メールアドレスを入力してください",
                  })}
                  className="left-3 pl-10 py-3 pr-3 block w-full rounded-xl border border-border bg-input-background  text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="example@company.com"
                />
                </div>  
              </div>

              {errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.email.message}
                </p>
              )}              

              <div>
                <label htmlFor="password" className="font-bold text-sm">
                  パスワード
                </label>
                <div className="flex w-full items-center rounded-xl border border-border bg-input-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                  <Lock 
                    size={18}
                    aria-hidden="true"
                    className="ml-3 shrink-0 text-gray-400"
                  />
                  <input
                    id="password"
                    disabled={isSubmitting}
                    type={showPassword ? "text" : "password"}
                    {...register("password", {
                      required: "パスワードを入力してください",
                      minLength: {
                        value: 8,
                        message: "8文字以上で入力してください",
                      },
                    })}
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    placeholder={mode === "signUp" ? "8文字以上で入力" : "パスワードを入力"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
                    className="flex size-12 shrink-0 items-center justify-center text-gray-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}              

              { mode === "signUp" && (
                <>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label htmlFor="passwordConfirm" className="font-bold text-sm">
                        パスワード（確認）
                      </label>

                      <div className="relative">
                        <Lock 
                          size={18}
                          aria-hidden="true"
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input 
                          id="passwordConfirm"
                          type="password"
                          disabled={isSubmitting}
                          {...register("passwordConfirm", {
                            required: "確認用パスワードを入力してください",
                            validate: (value) => 
                              value === watch("password") ||
                              "パスワードが一致しません",
                          })}
                          className="left-3 pl-10 py-3 pr-3 block w-full rounded-xl border border-border bg-input-background text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="もう一度入力してください"
                        />
                      </div>
                    </div>

                    {errors.passwordConfirm && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.passwordConfirm.message}
                      </p>
                    )}                    

                    <p className="text-xs text-[#6B7280] p-3">
                      登録することで、
                      <span className="font-bold text-[#121723]">利用規約</span>
                      および
                      <span className="font-bold text-[#121723]">プライバシーポリシー</span>
                      に同意したものとみなされます。
                    </p>
                  </div>
                </>
              )}
          </div> 

          {errors.root?.auth?.message && (
            <p
              role="alert"
              className="text-sm text-red-500"
            >
              {errors.root.auth.message}
            </p>
          )}

          {submitSuccess && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800"
            >
              <CircleCheck size={20} aria-hidden="true"
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="text-sm font-bold">
                  {submitSuccess}
                </p>

                <p className="mt-1 text-sm text-green-700">
                  メール内のリンクを開いて、
                  登録を完了してください。
                </p>
              </div>
            </div>
          )}          

          <button
            type="submit"
            disabled={isSubmitting}
            className="text-[#FFFFFF] bg-[#F97316] font-bold cursor-pointer rounded-xl block w-full p-3 disabled:cursor-not-allowed disabled:opacity-50">
            {isSubmitting ? "処理中..." : content.submitLabel}
          </button>

          <div className="flex items-center text-gray-500">
            <div className="grow border-t border-gray-300"></div>
            <span className="mx-4 shrink-0 text-sm">または</span>
            <div className="grow border-t border-gray-300"></div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white p-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Image
              src="/images/GoogleIcon.svg"
              alt=""
              width={20}
              height={20}
            />
            Googleで続ける
          </button>

          { mode === "signUp" && (
            <Link
              href=""
              className="text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ゲストで始める
            </Link>
          )}

          <p className="text-center text-[#6B7280] text-sm">
            {content.footerText}{" "}
            <Link
              href={content.footerLinkHref}
              className="font-bold text-[#F97316]"
            >
              {content.footerLinkLabel}
            </Link>
          </p>
        </form>
      </div>
    </>
  )
}