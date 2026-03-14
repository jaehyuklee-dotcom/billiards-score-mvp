"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  FileText,
  Home as HomeIcon,
  Play,
  Settings,
  Target,
  Trophy,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard-header";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const [stats, setStats] = useState({
    average: "0.000",
    winRate: "0",
    weeklyGames: 0,
    loading: true
  });

  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStats(prev => ({ ...prev, loading: false }));
        return;
      }

      // 1. 전체 경기 기록 가져오기
      const { data: matches } = await supabase
        .from("matches")
        .select("*")
        .eq("user_id", user.id);

      if (matches && matches.length > 0) {
        const totalScore = matches.reduce((acc, m) => acc + m.my_score, 0);
        const totalInnings = matches.reduce((acc, m) => acc + m.innings, 0);
        const wins = matches.filter(m => m.is_win).length;
        
        // 2. 이번 주 게임 수 계산 (최근 7일)
        const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
        const weeklyGames = matches.filter(m => 
        new Date().getTime() - new Date(m.created_at).getTime() < ONE_WEEK_MS
        ).length;

        setStats({
          average: (totalScore / (totalInnings || 1)).toFixed(3),
          winRate: ((wins / matches.length) * 100).toFixed(0),
          weeklyGames,
          loading: false
        });
      } else {
        setStats(prev => ({ ...prev, loading: false }));
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-24 pt-10">
        <DashboardHeader />

        <section className="mt-10 flex flex-1 flex-col gap-5">
          {/* 1. 이닝 당 평균 득점 (에버리지) */}
          <div className="w-full rounded-2xl border border-white/5 bg-[#1a1a1a] p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-[#1fe85b]" />
              <h2 className="text-[14px] font-semibold text-white/90">평균 에버리지</h2>
            </div>
            <div className="mt-5 text-[56px] font-black leading-none tracking-tight text-[#1fe85b]">
              {stats.loading ? "..." : stats.average}
            </div>
            <p className="mt-2 text-[12px] font-medium text-white/50">전체 경기 데이터를 기준으로 실시간 계산됩니다.</p>
          </div>

          {/* 2. 목표 점수 (기본 400점 세팅) */}
          <div className="w-full rounded-2xl border border-white/5 bg-[#1a1a1a] p-6">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-[#1fe85b]" />
              <h2 className="text-[14px] font-semibold text-white/90">나의 목표 점수</h2>
            </div>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-[56px] font-black leading-none tracking-tight text-white">400점</span>
              <span className="text-[14px] font-medium text-white/50">(4구)</span>
            </div>
          </div>

          {/* 3. 승률 및 게임 수 */}
          <div className="grid w-full grid-cols-2 gap-5">
            <div className="w-full rounded-2xl border border-white/5 bg-[#1a1a1a] p-6">
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-[#1fe85b]" />
                <h2 className="text-[14px] font-semibold text-white/90">승률</h2>
              </div>
              <div className="mt-5 text-[56px] font-black leading-none tracking-tight text-[#1fe85b]">
                {stats.loading ? "..." : `${stats.winRate}%`}
              </div>
            </div>
            <div className="w-full rounded-2xl border border-white/5 bg-[#1a1a1a] p-6">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-6 w-6 text-[#1fe85b]" />
                <h2 className="text-[14px] font-semibold text-white/90">이번 주 게임</h2>
              </div>
              <div className="mt-5 text-[56px] font-black leading-none tracking-tight text-[#1fe85b]">
                {stats.loading ? "..." : stats.weeklyGames}
              </div>
            </div>
          </div>
        </section>

        {/* 게임 시작 버튼 */}
        <div className="w-full pb-6 pt-6">
          <Link href="/setup" className="flex h-[76px] w-full items-center justify-center gap-4 rounded-2xl bg-[#1fe85b] text-[26px] font-black tracking-tight text-[#0b0b0b] shadow-[0_0_48px_rgba(31,232,91,0.5)]">
            <Play className="h-8 w-8 text-[#0b0b0b]" />
            게임 시작
          </Link>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-white/10 bg-[#0b0b0b] py-4">
        <Link href="/" className="flex flex-col items-center gap-1 text-[#1fe85b]">
          <HomeIcon className="h-6 w-6" /><span className="text-[12px] font-medium">홈</span>
        </Link>
        <Link href="/history" className="flex flex-col items-center gap-1 text-white/70">
          <FileText className="h-6 w-6" /><span className="text-[12px] font-medium">기록</span>
        </Link>
        <Link href="/ranking" className="flex flex-col items-center gap-1 text-white/70">
          <BarChart3 className="h-6 w-6" /><span className="text-[12px] font-medium">랭킹</span>
        </Link>
        <Link href="/setup" className="flex flex-col items-center gap-1 text-white/70">
          <Settings className="h-6 w-6" /><span className="text-[12px] font-medium">설정</span>
        </Link>
      </nav>
    </div>
  );
}