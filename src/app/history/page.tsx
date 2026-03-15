"use client";

import { FileText, MapPin, Play, Trophy } from "lucide-react";
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
  created_at: string;
};

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const dayName = DAY_NAMES[d.getDay()];
  return `${y}년 ${m}월 ${day}일 ${dayName}요일`;
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
            const firstMatch = dayMatches[0];
            const header = formatDateHeader(firstMatch.created_at);

            return (
              <div key={dateKey} className="flex flex-col gap-3">
                <h3 className="text-[13px] font-semibold text-white/60">{header}</h3>
                <div className="flex flex-col gap-3">
                  {dayMatches.map((match) => {
                    const isMultiplayer = match.rankings && match.rankings.length >= 2;
                    const myRank = isMultiplayer
                      ? match.rankings!.find((r) => r.playerIndex === 0)?.rank ?? 0
                      : match.is_win ? 1 : 2;
                    const maxRank = isMultiplayer ? Math.max(...match.rankings!.map((r) => r.rank)) : 0;
                    const lastPlace = isMultiplayer
                      ? match.rankings!.find((r) => r.rank === maxRank)
                      : null;
                    const lastPlaceName = lastPlace?.name ?? "꼴찌";
                    const avg = match.innings > 0 ? (match.my_score / match.innings).toFixed(2) : "-";

                    return (
                      <div
                        key={match.id}
                        className={`relative overflow-hidden rounded-xl border border-white/5 bg-[#1a1a1a] p-4 ${
                          match.is_win ? "border-l-4 border-l-[#1fe85b]" : ""
                        }`}
                      >
                        <div>
                          {isMultiplayer ? (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-[14px] font-semibold text-white">
                                  다인전 ({match.rankings!.length}인)
                                </span>
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${
                                    myRank === 1
                                      ? "bg-[#1fe85b]/20 text-[#1fe85b]"
                                      : "bg-white/10 text-white/70"
                                  }`}
                                >
                                  {myRank}위
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-white/80">
                                <span>내 점수 {match.my_score}</span>
                                <span>·</span>
                                <span>꼴찌 {lastPlaceName}</span>
                                <span>·</span>
                                <span>{match.innings}이닝</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-[14px] font-semibold text-white">
                                  vs 상대
                                </span>
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${
                                    match.is_win
                                      ? "bg-[#1fe85b]/20 text-[#1fe85b]"
                                      : "bg-white/10 text-white/70"
                                  }`}
                                >
                                  {match.is_win ? "Win" : "Loss"}
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-white/80">
                                <span>
                                  {match.my_score} : {match.opponent_score}
                                </span>
                                <span>·</span>
                                <span>{match.innings}이닝</span>
                                <span>·</span>
                                <span>에버리지 {avg}</span>
                              </div>
                            </>
                          )}
                          {match.club_name && (
                            <div className="mt-2 flex items-center gap-1.5 text-[12px] text-white/50">
                              <MapPin className="h-3.5 w-3.5" />
                              {match.club_name}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
