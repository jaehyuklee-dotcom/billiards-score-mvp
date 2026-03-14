"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Trophy } from "lucide-react";

export default function ResultPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const winner = sp.get("winner")?.trim() || "OOO";

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <main className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col items-center justify-center px-6 pb-24">
        <Trophy className="h-24 w-24 text-yellow-400" aria-hidden="true" />

        <div className="mt-10 text-center text-[44px] font-extrabold leading-[1.1] text-white">
          {winner}님이
          <br />
          승리하셨습니다!
        </div>

        <div className="mt-10 grid w-full grid-cols-2 gap-4">
          <Link
            href="/setup"
            className="flex h-[56px] items-center justify-center rounded-md bg-[#5b5b5b] text-[18px] font-extrabold text-white"
          >
            다시 플레이
          </Link>
          <button
            type="button"
            onClick={() => alert("준비 중입니다.")}
            className="flex h-[56px] items-center justify-center rounded-md bg-[#2a2a2a] text-[18px] font-extrabold text-white"
          >
            상세 보기
          </button>
        </div>

        <Link
          href="/"
          className="mt-4 flex h-[60px] w-full items-center justify-center rounded-md bg-[#1fe85b] text-[20px] font-extrabold text-[#0b0b0b]"
        >
          홈으로
        </Link>

        <p className="mt-6 text-center text-[13px] font-medium text-white/50">
          혹시 실수로 경기 승리 화면으로 오셨다면 돌아가기를 터치해주세요
        </p>

        <button
          type="button"
          onClick={() => router.back()}
          className="mt-3 flex h-[48px] w-full items-center justify-center rounded-md border border-white/30 bg-transparent text-[15px] font-semibold text-white/80"
        >
          경기 계속하기 (복귀)
        </button>
      </main>
    </div>
  );
}

