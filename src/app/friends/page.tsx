"use client";

import { Users } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { DashboardHeader } from "@/components/dashboard-header";

export default function FriendsPage() {
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-24 pt-10">
        <DashboardHeader />

        <section className="mt-10 flex flex-1 flex-col items-center justify-center gap-6 px-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#1fe85b]/30 bg-[#1fe85b]/10">
            <Users className="h-10 w-10 text-[#1fe85b]" />
          </div>
          <h1 className="text-[22px] font-bold text-white">내 친구 목록</h1>
          <p className="text-center text-[14px] leading-relaxed text-white/60">
            함께 당구를 즐길 친구를 찾아보세요 (준비 중)
          </p>
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
