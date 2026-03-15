"use client";

import { ChevronLeft, Play, UserPlus, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PlayerSetup = {
  id: number;
  name: string;
  target: string;
  guest?: boolean;
  finish?: string;
  userId?: string;
};

const SCORE_4GU_ALERT = "4구 점수는 10단위로만 입력 가능합니다. (예: 120, 150, 200)";
const SCORE_3CUSHION_ALERT = "3쿠션 목표 점수를 입력해 주세요 (예: 17, 21)";

function isValidScore4gu(val: number): boolean {
  return Number.isFinite(val) && val > 0 && val % 10 === 0;
}

function isValidScore3cushion(val: number): boolean {
  return Number.isFinite(val) && val > 0 && Number.isInteger(val);
}

export default function SetupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [gameType, setGameType] = useState<"3" | "4">("4");
  const [players, setPlayers] = useState<PlayerSetup[]>([
    { id: 1, name: "1번 선수", target: "400", guest: false, finish: "1" },
    { id: 2, name: "2번 선수", target: "400", guest: false, finish: "1" },
  ]);

  const defaultTarget = gameType === "3" ? "20" : "400";

  const [p1LoadRecent, setP1LoadRecent] = useState(true);
  const [finishSameForAll, setFinishSameForAll] = useState(true);
  const [hasHistory, setHasHistory] = useState(false);
  const [isP1LoggedIn, setIsP1LoggedIn] = useState(false);
  const targetInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 로그인 유저 정보 불러오기, 1번 선수 매칭, 기록 존재 여부 확인
  useEffect(() => {
    async function fetchUserAndHistory() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasHistory(false);
        setIsP1LoggedIn(false);
        setPlayers((prev) =>
          prev.map((p) => (p.id === 1 ? { ...p, name: "1번 선수", userId: undefined } : p))
        );
        return;
      }
      setIsP1LoggedIn(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("user_id", user.id)
        .single();
      const nickname =
        profile?.nickname?.trim() ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "나";
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === 1
            ? {
                ...p,
                name: nickname,
                userId: user.id,
              }
            : p
        )
      );

      const { data: matches } = await supabase
        .from("matches")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
      setHasHistory((matches?.length ?? 0) > 0);
    }
    fetchUserAndHistory();
  }, []);

  const canStart = useMemo(() => {
    if (players.length < 2) return false;
    return players.every((p) => {
      const t = Number(p.target);
      const f = Number(p.finish ?? 1);
      return (
        p.name.trim().length > 0 &&
        Number.isFinite(t) &&
        t > 0 &&
        Number.isFinite(f) &&
        f > 0
      );
    });
  }, [players]);

  // [복구] 선수 정보 변경 핸들러
  const handlePlayerChange = (index: number, field: "name" | "target" | "finish", value: string) => {
    setPlayers((prev) => {
      if (field === "name" && index === 0 && isP1LoggedIn) return prev;
      if (field === "finish" && index === 0 && finishSameForAll) {
        return prev.map((p) => ({ ...p, finish: value }));
      }
      return prev.map((p, i) => (i === index ? { ...p, [field]: value } : p));
    });
  };

  // [복구] 선수 추가 기능
  const handleAddPlayer = () => {
    setPlayers((prev) => {
      if (prev.length >= 6) return prev;
      const nextId = prev.length + 1;
      const baseFinish = finishSameForAll ? prev[0]?.finish ?? "1" : "1";
      return [
        ...prev,
        { id: nextId, name: `${nextId}번 선수`, target: defaultTarget, guest: false, finish: baseFinish },
      ];
    });
  };

  // [복구] 선수 삭제 기능
  const handleRemovePlayer = () => {
    setPlayers((prev) => (prev.length > 2 ? prev.slice(0, -1) : prev));
  };

  const validateAllScores = (): { invalidIdx: number | null; message: string } => {
    const validator = gameType === "4" ? isValidScore4gu : isValidScore3cushion;
    const message = gameType === "4" ? SCORE_4GU_ALERT : SCORE_3CUSHION_ALERT;
    for (let i = 0; i < players.length; i++) {
      const val = Number(players[i]?.target);
      if (!validator(val)) return { invalidIdx: i, message };
    }
    return { invalidIdx: null, message: "" };
  };

  const playerLabelBgClasses = [
    "bg-orange-500", "bg-blue-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-teal-500",
  ];

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <main className="mx-auto w-full max-w-[420px] px-6 pb-24 pt-10">
        <header className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push("/")}
              aria-label="홈으로"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#d9d9d9]/70"
            >
              <ChevronLeft className="h-5 w-5 text-black/70" aria-hidden />
            </button>
            <h1 className="text-[24px] font-extrabold">경기 세팅</h1>
          </div>
          
          {/* 3구 / 4구 선택 */}
          <div className="grid grid-cols-2 gap-4">
            {["3", "4"].map((type) => (
              <button
                key={type}
                onClick={() => setGameType(type as "3" | "4")}
                className={`h-[74px] rounded-xl text-[26px] font-extrabold ${gameType === type ? "bg-[#1fe85b] text-[#0b0b0b]" : "bg-[#1a1a1a] text-white"}`}
              >
                {type}구
              </button>
            ))}
          </div>
        </header>

        <section className="mt-8 space-y-6">
          {players.map((player, index) => (
            <div key={player.id} className={`rounded-2xl border bg-[#1a1a1a] px-5 py-5 ${index === 0 ? "border-[#ff6a3d]" : "border-white/5"}`}>
              <div className="flex min-h-[40px] items-center justify-between gap-3">
                <div className={`shrink-0 rounded-md px-4 py-2 text-[16px] font-extrabold text-white ${playerLabelBgClasses[index % 6]}`}>
                  {player.id}번 선수 {index === 0 && "(나)"}
                </div>
                {index === 0 && hasHistory && (
                  <label className="flex shrink-0 items-center gap-2 text-[13px] font-semibold text-white/70">
                    <input
                      type="checkbox"
                      checked={p1LoadRecent}
                      onChange={(e) => setP1LoadRecent(e.target.checked)}
                      className="accent-[#1fe85b]"
                    />
                    기록 불러오기
                  </label>
                )}
              </div>

              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <div className="text-[14px] text-white/60">선수명</div>
                  <input
                    value={player.name}
                    onChange={(e) => handlePlayerChange(index, "name", e.target.value)}
                    readOnly={index === 0 && isP1LoggedIn}
                    className={`h-12 w-full rounded-md px-4 text-[18px] font-extrabold outline-none ${
                      index === 0 && isP1LoggedIn
                        ? "bg-white/5 text-white/90 cursor-not-allowed"
                        : "bg-black/35"
                    }`}
                  />
                </div>
                <div className={`grid gap-4 ${gameType === "3" ? "grid-cols-1" : "grid-cols-2"}`}>
                  <div className="space-y-2">
                    <div className="text-[14px] text-white/60">목표 점수</div>
                    <input
                      ref={(el) => { targetInputRefs.current[index] = el; }}
                      value={player.target}
                      onChange={(e) => handlePlayerChange(index, "target", e.target.value)}
                      inputMode="numeric"
                      className="h-12 w-full rounded-md bg-black/35 px-4 text-[18px] font-extrabold outline-none"
                    />
                  </div>
                  {gameType === "4" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[14px] text-white/60">마무리</div>
                        {index === 0 && (
                          <label className="flex items-center gap-2 text-[13px] font-semibold text-white/70">
                            <input
                              type="checkbox"
                              checked={finishSameForAll}
                              onChange={(e) => setFinishSameForAll(e.target.checked)}
                              className="accent-[#1fe85b]"
                            />
                            모든 선수 동일
                          </label>
                        )}
                      </div>
                      <input
                        value={player.finish}
                        onChange={(e) => handlePlayerChange(index, "finish", e.target.value)}
                        inputMode="numeric"
                        className="h-12 w-full rounded-md bg-black/35 px-4 text-[18px] font-extrabold outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* [복구] 선수 추가/삭제 버튼 */}
          <div className="flex gap-3 mt-4">
            <button onClick={handleAddPlayer} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-white/25 text-white/80">
              <UserPlus size={18} /> 선수 추가
            </button>
            {players.length > 2 && (
              <button onClick={handleRemovePlayer} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 text-white/50">
                <UserMinus size={18} /> 선수 삭제
              </button>
            )}
          </div>

          <button
            disabled={!canStart}
            onClick={() => {
              const { invalidIdx, message } = validateAllScores();
              if (invalidIdx !== null) {
                alert(message);
                targetInputRefs.current[invalidIdx]?.focus();
                return;
              }
              const playersToSend = players.map((p) => ({
                id: p.id,
                name: p.name,
                target: Number(p.target) || 400,
                finish: Number(p.finish ?? 1) || 1,
                userId: p.userId,
              }));
              const params = new URLSearchParams({
                g: gameType,
                players: JSON.stringify(playersToSend),
              });
              router.push(`/play?${params.toString()}`);
            }}
            className={`flex h-[78px] w-full items-center justify-center gap-4 rounded-2xl text-[26px] font-extrabold ${canStart ? "bg-[#1fe85b] text-[#0b0b0b]" : "bg-[#1fe85b]/50 text-[#0b0b0b]/70"}`}
          >
            <Play className="h-7 w-7" /> 게임 시작
          </button>
        </section>
      </main>
    </div>
  );
}