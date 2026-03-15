"use client";

import { Calendar, FileText, MapPin, Play, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BottomNav } from "@/components/bottom-nav";
import { DashboardHeader } from "@/components/dashboard-header";
import type { RankingEntry } from "@/lib/matches";

type Match = {
  id: string;
  user_id: string | null;
  my_score: number;
  opponent_score: number;
  innings: number;
  is_win: boolean;
  rankings: RankingEntry[] | null;
  club_name?: string | null;
  opponent_name?: string | null;
  game_type?: string | null;
  created_at: string;
};

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function formatDateCard(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}년 ${m}월 ${day}일`;
}

function getDateKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchMatches() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }
      setIsLoggedIn(true);
      const { data } = await supabase
        .from("matches")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setMatches((data as Match[]) ?? []);
      setLoading(false);
    }
    fetchMatches();
  }, [supabase.auth]);

  const groupedByDate = matches.reduce<Record<string, Match[]>>((acc, m) => {
    const key = getDateKey(m.created_at);
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const sortedDateKeys = Object.keys(groupedByDate).sort((a, b) => (a > b ? -1 : 1));

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-24 pt-10">
          <DashboardHeader />
          <section className="mt-10 flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <FileText className="h-16 w-16 text-white/30" />
            <p className="text-[16px] font-medium text-white/70">
              로그인 후 소중한 경기 기록을 관리해보세요
            </p>
            <Link
              href="/login"
              className="flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-[#1fe85b] text-[16px] font-bold text-[#0b0b0b] transition-opacity hover:opacity-95"
            >
              로그인
            </Link>
          </section>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 pb-24 pt-10">
          <div className="text-[16px] font-medium text-white/60">로딩 중...</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-24 pt-10">
          <DashboardHeader />
          <section className="mt-10 flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <Trophy className="h-16 w-16 text-white/30" />
            <p className="text-[16px] font-medium text-white/70">
              아직 기록된 경기가 없습니다.
              <br />
              오늘 첫 게임을 시작해보세요!
            </p>
            <Link
              href="/setup"
              className="flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-[#1fe85b] text-[16px] font-bold text-[#0b0b0b] transition-opacity hover:opacity-95"
            >
              <Play className="h-5 w-5" />
              게임 시작
            </Link>
          </section>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-24 pt-10">
        <DashboardHeader />

        <section className="mt-10 flex flex-1 flex-col gap-6">
          <h2 className="flex items-center gap-2 text-[18px] font-bold text-white">
            <FileText className="h-5 w-5 text-[#1fe85b]" />
            경기 기록
          </h2>

          {sortedDateKeys.map((dateKey) => {
            const dayMatches = groupedByDate[dateKey];
            return (
              <div key={dateKey} className="flex flex-col gap-3">
                {dayMatches.map((match) => {
                  const isMultiplayer = match.rankings && match.rankings.length >= 2;
                  const myRank = isMultiplayer
                    ? match.rankings!.find((r) => r.playerIndex === 0)?.rank ?? 0
                    : match.is_win ? 1 : 2;
                  const myAvg =
                    match.innings > 0
                      ? (match.my_score / match.innings).toFixed(3)
                      : "-";
                  const oppAvg =
                    match.innings > 0
                      ? (match.opponent_score / match.innings).toFixed(3)
                      : "-";
                  const gameLabel = match.game_type === "3" ? "3구" : "4구";
                  const opponentName =
                    match.opponent_name?.trim() || (isMultiplayer ? "다인전" : "상대");

                  if (isMultiplayer) {
                    const maxRank = Math.max(...match.rankings!.map((r) => r.rank));
                    const lastPlace = match.rankings!.find((r) => r.rank === maxRank);
                    const lastPlaceName = lastPlace?.name ?? "꼴찌";
                    return (
                      <div
                        key={match.id}
                        className={`relative overflow-hidden rounded-xl border bg-[#1a1a1a] p-5 ${
                          myRank === 1 ? "border-2 border-[#1fe85b]" : "border border-white/5"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0 text-white/60" />
                            <span className="text-[14px] font-medium text-white">
                              {formatDateCard(match.created_at)}
                            </span>
                            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[12px] font-semibold text-white/80">
                              {gameLabel}
                            </span>
                          </div>
                          <span
                            className={`shrink-0 rounded px-2.5 py-1 text-[13px] font-bold ${
                              myRank === 1 ? "bg-[#1fe85b] text-[#0b0b0b]" : "bg-red-500 text-white"
                            }`}
                          >
                            {myRank}위
                          </span>
                        </div>
                        <div className="mt-4">
                          <p className="text-[13px] text-white/60">VS {lastPlaceName} 외</p>
                          <div className="mt-3 flex items-center gap-4 text-[13px] text-white/70">
                            <span>내 점수 {match.my_score}</span>
                            <span>·</span>
                            <span>{match.innings}이닝</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={match.id}
                      className={`relative overflow-hidden rounded-xl border bg-[#1a1a1a] p-5 ${
                        match.is_win ? "border-2 border-[#1fe85b]" : "border border-white/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 shrink-0 text-white/60" />
                          <span className="text-[14px] font-medium text-white">
                            {formatDateCard(match.created_at)}
                          </span>
                          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[12px] font-semibold text-white/80">
                            {gameLabel}
                          </span>
                        </div>
                        <span
                          className={`shrink-0 rounded px-2.5 py-1 text-[13px] font-bold ${
                            match.is_win ? "bg-[#1fe85b] text-[#0b0b0b]" : "bg-red-500 text-white"
                          }`}
                        >
                          {match.is_win ? "승리" : "패배"}
                        </span>
                      </div>
                      <p className="mt-4 text-[13px] text-white/60">VS</p>
                      <p className="mt-0.5 text-[22px] font-extrabold text-white">
                        {opponentName}
                      </p>
                      <div className="mt-5 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[13px] font-semibold text-red-400">나</p>
                          <p className="mt-0.5 text-[32px] font-extrabold text-white">
                            {match.my_score}
                          </p>
                          <p className="text-[13px] text-white/60">
                            ({match.innings}이닝)
                          </p>
                          <p className="mt-0.5 text-[13px] text-white/60">
                            평균: {myAvg}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-semibold text-blue-400">상대</p>
                          <p className="mt-0.5 text-[32px] font-extrabold text-white">
                            {match.opponent_score}
                          </p>
                          <p className="text-[13px] text-white/60">
                            ({match.innings}이닝)
                          </p>
                          <p className="mt-0.5 text-[13px] text-white/60">
                            평균: {oppAvg}
                          </p>
                        </div>
                      </div>
                      {match.club_name && (
                        <div className="mt-4 flex items-center gap-1.5 text-[12px] text-white/50">
                          <MapPin className="h-3.5 w-3.5" />
                          {match.club_name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
