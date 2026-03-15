"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, CalendarDays, FileText, Play, Target, Trophy } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { DashboardHeader } from "@/components/dashboard-header";
import { getRecommendedScore } from "@/lib/recommended-score";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const [stats, setStats] = useState({
    average: "0.000",
    winRate: "0",
    weeklyGames: 0,
    loading: true,
    isLoggedIn: false
  });

  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStats(prev => ({ ...prev, loading: false, isLoggedIn: false }));
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

        const avg = totalInnings > 0 ? totalScore / totalInnings : 0;
        setStats({
          average: avg.toFixed(3),
          winRate: ((wins / matches.length) * 100).toFixed(0),
          weeklyGames,
          loading: false,
          isLoggedIn: true
        });
      } else {
        setStats(prev => ({ ...prev, loading: false, isLoggedIn: true }));
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
            <div className="mt-5 min-h-[56px] text-[56px] font-black leading-none tracking-tight text-[#1fe85b]">
              {stats.loading ? (
                "..."
              ) : !stats.isLoggedIn ? (
                <span className="block text-[14px] font-medium text-white/70">
                  로그인 후 확인 가능합니다
                </span>
              ) : (
                stats.average
              )}
            </div>
            <p className="mt-2 text-[12px] font-medium text-white/50">전체 경기 데이터를 기준으로 실시간 계산됩니다.</p>
          </div>

          {/* 2. 권장 점수 (평균 에버리지 × 15 기준) */}
          <div className="w-full rounded-2xl border border-white/5 bg-[#1a1a1a] p-6">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-[#1fe85b]" />
              <h2 className="text-[14px] font-semibold text-white/90">나의 권장 점수</h2>
            </div>
            <div className="mt-5 flex flex-col gap-1">
              {!stats.isLoggedIn ? (
                <span className="text-[14px] font-medium text-white/70">
                  로그인 후 확인 가능합니다
                </span>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-[56px] font-black leading-none tracking-tight text-white">
                    {getRecommendedScore(
                      stats.loading ? null : Number(stats.average),
                      stats.loading
                    )}
                    점
                  </span>
                  <span className="text-[14px] font-medium text-white/50">(4구)</span>
                </div>
              )}
            </div>
            <p className="mt-2 text-[12px] font-medium text-white/50">
              15이닝 완료 기준, 평균 에버리지 기반 계산
            </p>
          </div>

          {/* 3. 승률 및 게임 수 */}
          <div className="grid w-full grid-cols-2 gap-5">
            <div className="w-full rounded-2xl border border-white/5 bg-[#1a1a1a] p-6">
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-[#1fe85b]" />
                <h2 className="text-[14px] font-semibold text-white/90">승률</h2>
              </div>
              <div className="mt-5 min-h-[56px] text-[56px] font-black leading-none tracking-tight text-[#1fe85b]">
                {stats.loading ? (
                  "..."
                ) : !stats.isLoggedIn ? (
                  <span className="block text-[14px] font-medium text-white/70">
                    로그인 후 확인 가능합니다
                  </span>
                ) : (
                  `${stats.winRate}%`
                )}
              </div>
            </div>
            <div className="w-full rounded-2xl border border-white/5 bg-[#1a1a1a] p-6">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-6 w-6 text-[#1fe85b]" />
                <h2 className="text-[14px] font-semibold text-white/90">이번 주 게임</h2>
              </div>
              <div className="mt-5 min-h-[56px] text-[56px] font-black leading-none tracking-tight text-[#1fe85b]">
                {stats.loading ? (
                  "..."
                ) : !stats.isLoggedIn ? (
                  <span className="block text-[14px] font-medium text-white/70">
                    로그인 후 확인 가능합니다
                  </span>
                ) : (
                  stats.weeklyGames
                )}
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

      <BottomNav />
    </div>
  );
}