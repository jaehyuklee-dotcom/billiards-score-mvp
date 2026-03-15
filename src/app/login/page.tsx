"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function KakaoIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/");
      }
    });
  }, [router, supabase.auth]);

  const handleOAuthSignIn = async (provider: "google" | "kakao") => {
    setLoading(provider);
    try {
      const { data } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setLoading(null);
      }
    } catch {
      alert("로그인에 실패했습니다. 다시 시도해 주세요.");
      setLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0b0b0b] text-white">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-12">
        {/* 로고 영역 */}
        <div className="mb-8 flex flex-col items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#1fe85b] bg-[#0b0b0b]">
            <div className="h-8 w-8 rounded bg-[#1fe85b]/30" />
          </div>
          <div className="text-center">
            <h1 className="text-[28px] font-extrabold tracking-tight text-white">
              당구 스코어보드
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-white/80">
              평균 기반 랭킹 시스템
              <br />
              공정한 매칭을 위한 실력자 전용 플랫폼
            </p>
          </div>
        </div>

        {/* 소셜 로그인 버튼 */}
        <div className="flex w-full flex-col gap-4">
          <button
            type="button"
            onClick={() => handleOAuthSignIn("kakao")}
            disabled={!!loading}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#FEE500] text-[16px] font-semibold text-[#191919] transition-opacity hover:opacity-90 disabled:opacity-70"
          >
            <KakaoIcon />
            카카오로 시작하기
          </button>
          <button
            type="button"
            onClick={() => handleOAuthSignIn("google")}
            disabled={!!loading}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-white text-[16px] font-semibold text-[#191919] transition-opacity hover:opacity-95 disabled:opacity-70"
          >
            <GoogleIcon />
            구글로 시작하기
          </button>
        </div>
      </div>

      {/* 하단 법적 고지 */}
      <footer className="py-8 text-center">
        <p className="text-[12px] font-medium text-white/50">
          계속 진행하면 이용약관과 개인정보처리방침에 동의하는 것으로
          간주됩니다
        </p>
        <p className="mt-2 text-[11px] text-white/40">
          © 2028 당구 스코어보드. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
