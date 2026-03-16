"use client";

import { saveMatch } from "@/lib/matches";
import { ChevronLeft, Maximize2, Minimize2, Plus, Trophy } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function clampToNonNegative(n: number) {
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

type RankEntry = { playerIndex: number; rank: number };

type WinModalProps = {
  /** 2인: 승자 이름, 3인+: 꼴찌(패자) 이름 */
  winnerName: string;
  rankEntries?: RankEntry[];
  players: { name: string }[];
  onResume: () => void;
  onGoHome: () => Promise<void>;
};

function WinModal({
  winnerName,
  rankEntries,
  players,
  onResume,
  onGoHome,
}: WinModalProps) {
  const [saving, setSaving] = useState(false);
  const isMultiPlayer = (rankEntries?.length ?? 0) >= 3;

  const handleGoHome = async () => {
    setSaving(true);
    await onGoHome();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b0b0b]/95">
      <div className="mx-auto flex w-full max-w-[420px] flex-col items-center justify-center px-6 pb-24">
        <Trophy className="h-24 w-24 text-yellow-400" aria-hidden="true" />

        {isMultiPlayer ? (
          <div className="mt-10 w-full space-y-4">
            <div className="text-center text-[44px] font-extrabold leading-[1.1] text-white">
              {winnerName}님이
              <br />
              패배하셨습니다!
            </div>
            <div className="text-center text-[16px] font-semibold text-white/70">
              순위 (목표 달성 순서)
            </div>
            {rankEntries!
              .slice()
              .filter((e, i, arr) => arr.findIndex((x) => x.playerIndex === e.playerIndex) === i)
              .sort((a, b) => a.rank - b.rank)
              .map(({ playerIndex, rank }) => (
                <div
                  key={`${rank}-${playerIndex}`}
                  className="flex items-center justify-between rounded-xl bg-[#1a1a1a] px-4 py-3"
                >
                  <span className="text-[14px] font-bold text-white/70">
                    {rank}위
                  </span>
                  <span className="text-[18px] font-extrabold text-white">
                    {players[playerIndex]?.name ?? `선수 ${playerIndex + 1}`}
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <div className="mt-10 text-center text-[44px] font-extrabold leading-[1.1] text-white">
            {winnerName}님이
            <br />
            승리하셨습니다!
          </div>
        )}

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

        <button
          type="button"
          onClick={handleGoHome}
          disabled={saving}
          className="mt-4 flex h-[60px] w-full items-center justify-center rounded-md bg-[#1fe85b] text-[20px] font-extrabold text-[#0b0b0b] disabled:opacity-70"
        >
          {saving ? "저장 중..." : "홈으로"}
        </button>

        <p className="mt-6 text-center text-[13px] font-medium text-white/50">
          혹시 실수로 경기 승리 화면으로 오셨다면 돌아가기를 터치해주세요
        </p>
        <button
          type="button"
          onClick={onResume}
          className="mt-3 flex h-[48px] w-full items-center justify-center rounded-md border border-white/30 bg-transparent text-[15px] font-semibold text-white/80"
        >
          경기 계속하기 (복귀)
        </button>
      </div>
    </div>
  );
}

type PlayerRuntime = {
  id: number;
  name: string;
  target: number;
  score: number;
  finish: number;
  userId?: string;
};

type GameState = {
  players: PlayerRuntime[];
  activeIndex: number;
  innings: number[];
  remainingFinish: number[];
  completedRanks: RankEntry[];
};

function PlayContent() {
  const router = useRouter();
  const sp = useSearchParams();

  const gameType = sp.get("g") === "3" ? "3" : "4";
  const delta = gameType === "4" ? 10 : 1;

  let initialPlayers: PlayerRuntime[] = [];
  const playersParam = sp.get("players");

  if (playersParam) {
    try {
      const parsed = JSON.parse(playersParam) as {
        id: number;
        name: string;
        target: number;
        finish?: number;
        userId?: string;
      }[];
      if (Array.isArray(parsed) && parsed.length >= 2) {
        initialPlayers = parsed.map((p, index) => ({
          id: p.id ?? index + 1,
          name: p.name || `Player ${index + 1}`,
          target: Number.isFinite(p.target) && p.target > 0 ? p.target : 400,
          score: 0,
          finish:
            Number.isFinite(p.finish) && (p.finish ?? 0) > 0
              ? Number(p.finish)
              : 1,
          userId: p.userId,
        }));
      }
    } catch {
      // ignore and fall back
    }
  }

  if (initialPlayers.length === 0) {
    const p1Name = sp.get("p1")?.trim() || "Player 1";
    const p2Name = sp.get("p2")?.trim() || "Player 2";
    const t1 = Number(sp.get("t1") ?? 400);
    const t2 = Number(sp.get("t2") ?? 400);
    const p1Target = Number.isFinite(t1) && t1 > 0 ? t1 : 400;
    const p2Target = Number.isFinite(t2) && t2 > 0 ? t2 : 400;

    initialPlayers = [
      { id: 1, name: p1Name, target: p1Target, score: 0, finish: 1 },
      { id: 2, name: p2Name, target: p2Target, score: 0, finish: 1 },
    ];
  }

  const [players, setPlayers] = useState<PlayerRuntime[]>(initialPlayers);
  const [activeIndex, setActiveIndex] = useState(0);
  const [innings, setInnings] = useState<number[]>(
    () => initialPlayers.map((_, i) => (i === 0 ? 1 : 0))
  );
  const [remainingFinish, setRemainingFinish] = useState<number[]>(
    () => initialPlayers.map((p) => (Number.isFinite(p.finish) && p.finish > 0 ? p.finish : 1))
  );

  const [history, setHistory] = useState<GameState[]>([]);
  const [showWinModal, setShowWinModal] = useState(false);
  const [winnerName, setWinnerName] = useState("");
  const [completedRanks, setCompletedRanks] = useState<RankEntry[]>([]);

  const colorBgClasses = [
    "bg-orange-500",
    "bg-blue-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-teal-500",
  ] as const;

  const colorTextClasses = [
    "text-orange-500",
    "text-blue-500",
    "text-yellow-500",
    "text-purple-500",
    "text-pink-500",
    "text-teal-500",
  ] as const;

  const glowClasses = [
    "shadow-[0_-26px_40px_rgba(249,115,22,0.26),0_26px_40px_rgba(249,115,22,0.26)]",
    "shadow-[0_-26px_40px_rgba(59,130,246,0.26),0_26px_40px_rgba(59,130,246,0.26)]",
    "shadow-[0_-26px_40px_rgba(234,179,8,0.26),0_26px_40px_rgba(234,179,8,0.26)]",
    "shadow-[0_-26px_40px_rgba(168,85,247,0.26),0_26px_40px_rgba(168,85,247,0.26)]",
    "shadow-[0_-26px_40px_rgba(236,72,153,0.26),0_26px_40px_rgba(236,72,153,0.26)]",
    "shadow-[0_-26px_40px_rgba(20,184,166,0.26),0_26px_40px_rgba(20,184,166,0.26)]",
  ] as const;

  const snapshot = (): GameState => ({
    players: players.map((p) => ({ ...p })),
    activeIndex,
    innings: [...innings],
    remainingFinish: [...remainingFinish],
    completedRanks: [...completedRanks],
  });

  const isCompleted = (index: number) =>
    completedRanks.some((e) => e.playerIndex === index);

  const getNextActiveIndex = (from: number): number => {
    if (players.length <= 2) return (from + 1) % players.length;
    for (let i = 1; i < players.length; i++) {
      const next = (from + i) % players.length;
      if (!isCompleted(next)) return next;
    }
    return from;
  };

  const getNextActiveIndexExcluding = (from: number, exclude: number): number => {
    if (players.length <= 2) return (from + 1) % players.length;
    for (let i = 1; i < players.length; i++) {
      const next = (from + i) % players.length;
      if (next !== exclude && !isCompleted(next)) return next;
    }
    return from;
  };

  const pushHistory = () => {
    setHistory((prev) => [...prev, snapshot()]);
  };

  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // ignore
    }
  };

  const handleScoreAdd = (index: number) => {
    if (index !== activeIndex) return;
    const current = players[index];
    const isCurrentlyCushion = current.score >= current.target;

    if (isCurrentlyCushion) {
      pushHistory();
      setRemainingFinish((prev) => {
        const copy = [...prev];
        const before = copy[index] ?? 0;
        const next = before - 1;
        copy[index] = next;
        if (next <= 0) {
          if (players.length <= 2) {
            setWinnerName(current.name);
            setShowWinModal(true);
          } else {
            setCompletedRanks((prev) => {
              if (prev.some((e) => e.playerIndex === index)) return prev;
              const newRank = prev.length + 1;
              const updated = [...prev, { playerIndex: index, rank: newRank }];
              const remainingCount = players.length - updated.length;
              if (remainingCount === 1) {
                const lastIdx = players.findIndex((_, i) =>
                  !updated.some((e) => e.playerIndex === i)
                );
                if (lastIdx >= 0 && !updated.some((e) => e.playerIndex === lastIdx)) {
                  updated.push({ playerIndex: lastIdx, rank: players.length });
                  setWinnerName(players[lastIdx].name);
                }
                setShowWinModal(true);
              }
              return updated;
            });
            setActiveIndex((prev) => getNextActiveIndexExcluding(prev, index));
          }
        }
        return copy;
      });
      return;
    }

    pushHistory();
    setPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, score: p.score + delta } : p))
    );
  };

  const handleScoreSubtract = (index: number) => {
    if (index !== activeIndex) return;
    pushHistory();
    setPlayers((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, score: clampToNonNegative(p.score - delta) } : p
      )
    );
  };

  const handleTurnPass = () => {
    const nextIndex = getNextActiveIndex(activeIndex);
    pushHistory();
    setActiveIndex(nextIndex);
    setInnings((prev) => {
      const newInnings = [...prev];
      newInnings[nextIndex] = (prev[nextIndex] ?? 0) + 1;
      return newInnings;
    });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setPlayers(last.players.map((p) => ({ ...p })));
    setActiveIndex(last.activeIndex);
    setInnings([...last.innings]);
    setRemainingFinish([...last.remainingFinish]);
    setCompletedRanks(last.completedRanks ?? []);
    setHistory((prev) => prev.slice(0, -1));
  };

  const handleGameEnd = () => {
    const current = players[activeIndex];
    setWinnerName(current.name);
    setShowWinModal(true);
  };

  const isLandscapeTwoPlayer = players.length === 2;

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      {/* ========== 가로모드 레이아웃 (거치형 스코어보드) 4:2:4 ========== */}
      {isLandscapeTwoPlayer && (
        <div className="hidden h-screen flex-col landscape:flex">
          {/* 상단 바 최소화 */}
          <header className="flex shrink-0 items-center justify-between border-b border-white/5 bg-zinc-900/80 px-2 py-1">
            <button
              type="button"
              onClick={() => router.push("/setup")}
              className="inline-flex h-8 w-8 items-center justify-center rounded bg-white/10"
              aria-label="홈으로"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="text-[12px] font-bold text-white/60">{gameType}구</span>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex h-8 w-8 items-center justify-center rounded bg-white/10"
              aria-label={isFullscreen ? "전체화면 나가기" : "전체화면"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-[4fr_2fr_4fr]">
            {/* 좌측(4): 1번 선수 점수판 - 본인 턴일 때만 터치로 득점 */}
            {(() => {
              const index = 0;
              const player = players[index];
              const isActive = index === activeIndex;
              const rawInningsValue = innings[index];
              const inningsValue =
                typeof rawInningsValue === "number" && Number.isFinite(rawInningsValue)
                  ? rawInningsValue
                  : 0;
              const avg =
                inningsValue > 0 && Number.isFinite(player.score)
                  ? player.score / delta / inningsValue
                  : 0;
              const remainingScore = Math.max(0, player.target - player.score);
              const remainingFinishCount = remainingFinish[index] ?? 0;
              const isCushion = player.score >= player.target;
              return (
                <div
                  key={player.id}
                  className={[
                    "flex flex-col border-r border-white/5 bg-zinc-900",
                    isActive
                      ? "ring-2 ring-inset ring-[#1fe85b]/50 border-l-4 border-l-orange-500 shadow-[0_0_24px_rgba(249,115,22,0.4)] transition-shadow duration-300"
                      : "opacity-50",
                  ].join(" ")}
                >
                  <div className="flex shrink-0 flex-col gap-0.5 px-3 py-1.5">
                    <div className="inline-flex w-fit rounded px-2 py-0.5 text-[11px] font-extrabold text-white bg-orange-500">
                      1번
                    </div>
                    <div className="truncate text-[13px] font-bold text-white/90">{player.name}</div>
                    <div className="text-[10px] text-white/50">
                      목표 {player.target} ({remainingScore}/{remainingFinishCount})
                    </div>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
                    <button
                      type="button"
                      onClick={() => handleScoreAdd(index)}
                      disabled={!isActive}
                      className={[
                        "flex touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl px-6 py-4 transition-all",
                        isActive
                          ? "cursor-pointer active:scale-95 active:bg-white/5"
                          : "cursor-default pointer-events-none",
                      ].join(" ")}
                      aria-label="1번 선수 득점"
                    >
                      {isCushion ? (
                        <span className="text-[clamp(2.5rem,15vmin,7rem)] font-black leading-none text-[#1fe85b]">
                          쿠션
                        </span>
                      ) : (
                        <>
                          <span className="text-[clamp(4rem,35vmin,10rem)] font-black leading-none tracking-tight text-orange-500">
                            {player.score}
                          </span>
                          {isActive && (
                            <span className="flex items-center gap-1 text-[14px] font-bold text-[#1fe85b]">
                              <Plus className="h-5 w-5" /> 터치하여 득점
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex shrink-0 items-center justify-between border-t border-white/5 px-3 py-1 text-[11px]">
                    <span className="font-semibold text-white/60">이닝 {inningsValue}</span>
                    <span className="font-bold text-[#1fe85b]">
                      {Number.isFinite(avg) ? avg.toFixed(3) : "0.000"}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* 중앙(2): 컨트롤 바 - 턴 넘기기, 되돌리기, -10, 게임 종료 */}
            <div
              className={[
                "flex flex-col justify-evenly border-x border-white/10 px-3 py-4 transition-colors duration-300",
                activeIndex === 0
                  ? "bg-orange-950/30"
                  : "bg-blue-950/30",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={handleTurnPass}
                className="flex min-h-[64px] items-center justify-center rounded-xl bg-[#ff2d61] px-4 py-4 text-[18px] font-black text-white shadow-lg transition-transform active:scale-95"
              >
                턴 넘기기
              </button>
              <button
                type="button"
                disabled={history.length === 0}
                onClick={handleUndo}
                className={[
                  "flex min-h-[48px] items-center justify-center rounded-lg px-4 py-3 text-[13px] font-extrabold transition-transform active:scale-95",
                  history.length === 0
                    ? "cursor-not-allowed bg-zinc-800 text-white/40"
                    : "bg-zinc-700 text-white",
                ].join(" ")}
              >
                되돌리기
              </button>
              <button
                type="button"
                onClick={() => handleScoreSubtract(activeIndex)}
                disabled={players[activeIndex]?.score === 0}
                className={[
                  "flex min-h-[48px] items-center justify-center rounded-lg px-4 py-3 text-[16px] font-extrabold transition-transform active:scale-95",
                  (players[activeIndex]?.score ?? 0) === 0
                    ? "cursor-not-allowed bg-zinc-800 text-white/40"
                    : "bg-zinc-600 text-white",
                ].join(" ")}
              >
                -{delta}
              </button>
              <button
                type="button"
                onClick={handleGameEnd}
                className="flex min-h-[48px] items-center justify-center rounded-lg bg-zinc-800 px-4 py-3 text-[13px] font-extrabold text-white transition-transform active:scale-95"
              >
                게임 종료
              </button>
            </div>

            {/* 우측(4): 2번 선수 점수판 - 본인 턴일 때만 터치로 득점 */}
            {(() => {
              const index = 1;
              const player = players[index];
              const isActive = index === activeIndex;
              const rawInningsValue = innings[index];
              const inningsValue =
                typeof rawInningsValue === "number" && Number.isFinite(rawInningsValue)
                  ? rawInningsValue
                  : 0;
              const avg =
                inningsValue > 0 && Number.isFinite(player.score)
                  ? player.score / delta / inningsValue
                  : 0;
              const remainingScore = Math.max(0, player.target - player.score);
              const remainingFinishCount = remainingFinish[index] ?? 0;
              const isCushion = player.score >= player.target;
              return (
                <div
                  key={player.id}
                  className={[
                    "flex flex-col border-l border-white/5 bg-zinc-900",
                    isActive
                      ? "ring-2 ring-inset ring-[#1fe85b]/50 border-r-4 border-r-blue-500 shadow-[0_0_24px_rgba(59,130,246,0.4)] transition-shadow duration-300"
                      : "opacity-50",
                  ].join(" ")}
                >
                  <div className="flex shrink-0 flex-col gap-0.5 px-3 py-1.5">
                    <div className="inline-flex w-fit rounded px-2 py-0.5 text-[11px] font-extrabold text-white bg-blue-500">
                      2번
                    </div>
                    <div className="truncate text-[13px] font-bold text-white/90">{player.name}</div>
                    <div className="text-[10px] text-white/50">
                      목표 {player.target} ({remainingScore}/{remainingFinishCount})
                    </div>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
                    <button
                      type="button"
                      onClick={() => handleScoreAdd(index)}
                      disabled={!isActive}
                      className={[
                        "flex touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl px-6 py-4 transition-all",
                        isActive
                          ? "cursor-pointer active:scale-95 active:bg-white/5"
                          : "cursor-default pointer-events-none",
                      ].join(" ")}
                      aria-label="2번 선수 득점"
                    >
                      {isCushion ? (
                        <span className="text-[clamp(2.5rem,15vmin,7rem)] font-black leading-none text-[#1fe85b]">
                          쿠션
                        </span>
                      ) : (
                        <>
                          <span className="text-[clamp(4rem,35vmin,10rem)] font-black leading-none tracking-tight text-blue-500">
                            {player.score}
                          </span>
                          {isActive && (
                            <span className="flex items-center gap-1 text-[14px] font-bold text-[#1fe85b]">
                              <Plus className="h-5 w-5" /> 터치하여 득점
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex shrink-0 items-center justify-between border-t border-white/5 px-3 py-1 text-[11px]">
                    <span className="font-semibold text-white/60">이닝 {inningsValue}</span>
                    <span className="font-bold text-[#1fe85b]">
                      {Number.isFinite(avg) ? avg.toFixed(3) : "0.000"}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========== 세로모드 레이아웃 (기존 UI) - 3인+ 또는 세로화면 ========== */}
      <main
        className={[
          "mx-auto min-h-screen w-full max-w-[420px] pb-[172px]",
          isLandscapeTwoPlayer && "landscape:hidden",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <header className="flex h-14 items-center justify-center border-b border-white/10 bg-[#1a1a1a] px-4">
          <button
            type="button"
            onClick={() => router.push("/setup")}
            className="absolute left-[max(16px,calc((100vw-420px)/2+16px))] inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#d9d9d9]/70"
            aria-label="홈으로"
          >
            <ChevronLeft className="h-5 w-5 text-black/70" aria-hidden="true" />
          </button>
          <div className="text-[16px] font-extrabold text-white/80">
            종목 : {gameType}구
          </div>
        </header>

        {players.length === 2 ? (
          <>
            {players.map((player, index) => {
              const isActive = index === activeIndex;
              const isFirst = index === 0;
              const rawInningsValue = innings[index];
              const inningsValue =
                typeof rawInningsValue === "number" && Number.isFinite(rawInningsValue)
                  ? rawInningsValue
                  : 0;
              const avg =
                inningsValue > 0 && Number.isFinite(player.score)
                  ? player.score / delta / inningsValue
                  : 0;
              const remainingScore = Math.max(0, player.target - player.score);
              const remainingFinishCount = remainingFinish[index] ?? 0;
              const isCushion = player.score >= player.target;

              return (
                <section
                  key={player.id}
                  className={[
                    "px-6 py-6 bg-[#1a1a1a]",
                    isFirst ? "" : "border-t border-black/60",
                    isActive
                      ? `relative z-10 border-y border-white/20 ${
                          glowClasses[index] ?? glowClasses[0]
                        }`
                      : "opacity-40",
                  ].join(" ")}
                >
                  <div className="space-y-2">
                    <div
                      className={[
                        "inline-flex rounded-md px-4 py-2 text-[14px] font-extrabold text-white",
                        colorBgClasses[index] ?? "bg-white/10",
                      ].join(" ")}
                    >
                      {index + 1}번 선수
                    </div>
                    <div className="text-[22px] font-extrabold text-white">
                      {player.name}
                    </div>
                    <div className="text-[14px] font-extrabold text-white/60">
                      목표 점수 : {player.target}{" "}
                      <span className="text-[13px] font-semibold text-white/50">
                        ({remainingScore} / {remainingFinishCount})
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isActive) return;
                      const current = players[index];
                      const isCurrentlyCushion = current.score >= current.target;

                      if (isCurrentlyCushion) {
                        pushHistory();
                        setRemainingFinish((prev) => {
                          const copy = [...prev];
                          const before = copy[index] ?? 0;
                          const next = before - 1;
                          copy[index] = next;
                          if (next <= 0) {
                            if (players.length <= 2) {
                              setWinnerName(current.name);
                              setShowWinModal(true);
                            } else {
                              setCompletedRanks((prev) => {
                                if (prev.some((e) => e.playerIndex === index)) return prev;
                                const newRank = prev.length + 1;
                                const updated = [...prev, { playerIndex: index, rank: newRank }];
                                const remainingCount = players.length - updated.length;
                                if (remainingCount === 1) {
                                  const lastIdx = players.findIndex((_, i) =>
                                    !updated.some((e) => e.playerIndex === i)
                                  );
                                  if (lastIdx >= 0 && !updated.some((e) => e.playerIndex === lastIdx)) {
                                    updated.push({ playerIndex: lastIdx, rank: players.length });
                                    setWinnerName(players[lastIdx].name);
                                  }
                                  setShowWinModal(true);
                                }
                                return updated;
                              });
                              setActiveIndex((prev) =>
                                getNextActiveIndexExcluding(prev, index)
                              );
                            }
                          }
                          return copy;
                        });
                        return;
                      }

                      pushHistory();
                      setPlayers((prev) =>
                        prev.map((p, i) =>
                          i === index ? { ...p, score: p.score + delta } : p
                        )
                      );
                    }}
                    className={[
                      "mt-8 flex w-full items-center justify-center py-10",
                      isActive ? "" : "pointer-events-none",
                    ].join(" ")}
                    aria-label={`${index + 1}번 선수 득점`}
                  >
                    {isCushion ? (
                      <div className="text-[80px] font-extrabold leading-none text-[#1fe85b]">
                        쿠션
                      </div>
                    ) : (
                      <div
                        className={[
                          "text-[120px] font-extrabold leading-none",
                          colorTextClasses[index] ?? "text-white",
                        ].join(" ")}
                      >
                        {player.score}
                      </div>
                    )}
                  </button>

                  <div className="mt-2 flex items-end justify-between">
                    <div className="space-y-1">
                      <div className="text-[18px] font-extrabold text-white/70">
                        이닝
                      </div>
                      <div className="text-[20px] font-extrabold text-white">
                        {inningsValue}
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="text-[18px] font-extrabold text-white/70">
                        평균 득점
                      </div>
                      <div className="text-[20px] font-extrabold text-[#1fe85b]">
                        {Number.isFinite(avg) ? avg.toFixed(3) : "0.000"}
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </>
        ) : (
          <section className="px-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {players.map((player, index) => {
                const isActive = index === activeIndex && !isCompleted(index);
                const completed = isCompleted(index);
                const playerRank = completedRanks.find((e) => e.playerIndex === index)?.rank;
                const rawInningsValue = innings[index];
                const inningsValue =
                  typeof rawInningsValue === "number" && Number.isFinite(rawInningsValue)
                    ? rawInningsValue
                    : 0;
                const avg =
                  inningsValue > 0 && Number.isFinite(player.score)
                    ? player.score / delta / inningsValue
                    : 0;
                const isFirstRow = index === 0 || index === 1;
                const remainingScore = Math.max(0, player.target - player.score);
                const remainingFinishCount = remainingFinish[index] ?? 0;
                const isCushion = player.score >= player.target;

                return (
                  <div
                    key={player.id}
                    className={[
                      "rounded-2xl bg-[#1a1a1a] px-4 py-4 relative",
                      !isFirstRow ? "mt-2" : "",
                      completed ? "opacity-60" : "",
                      isActive
                        ? `border border-white/25 ${
                            glowClasses[index] ?? glowClasses[0]
                          }`
                        : !completed ? "opacity-40" : "",
                    ].join(" ")}
                  >
                    {completed && (
                      <div className="absolute right-3 top-3 rounded-md bg-[#1fe85b]/20 px-2 py-1 text-[11px] font-extrabold text-[#1fe85b]">
                        FINISH {playerRank}위
                      </div>
                    )}
                    <div className="space-y-1">
                        <div
                          className={`inline-flex rounded-md px-3 py-1 text-[12px] font-extrabold text-white ${
                            colorBgClasses[index] ?? "bg-white/10"
                          }`}
                        >
                          {index + 1}번 선수
                        </div>
                      <div className="truncate text-[16px] font-extrabold text-white">
                        {player.name}
                      </div>
                      <div className="text-[11px] font-semibold text-white/60">
                        목표 {player.target}점{" "}
                        <span className="block text-[10px] text-white/50">
                          ({remainingScore} / {remainingFinishCount})
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!isActive) return;
                        const current = players[index];
                        const isCurrentlyCushion = current.score >= current.target;

                        if (isCurrentlyCushion) {
                          pushHistory();
                          setRemainingFinish((prev) => {
                            const copy = [...prev];
                            const before = copy[index] ?? 0;
                            const next = before - 1;
                            copy[index] = next;
                            if (next <= 0) {
                              if (players.length <= 2) {
                                setWinnerName(current.name);
                                setShowWinModal(true);
                              } else {
                                setCompletedRanks((prev) => {
                                  if (prev.some((e) => e.playerIndex === index)) return prev;
                                  const newRank = prev.length + 1;
                                  const updated = [...prev, { playerIndex: index, rank: newRank }];
                                  const remainingCount = players.length - updated.length;
                                  if (remainingCount === 1) {
                                    const lastIdx = players.findIndex((_, i) =>
                                      !updated.some((e) => e.playerIndex === i)
                                    );
                                    if (lastIdx >= 0 && !updated.some((e) => e.playerIndex === lastIdx)) {
                                      updated.push({ playerIndex: lastIdx, rank: players.length });
                                      setWinnerName(players[lastIdx].name);
                                    }
                                    setShowWinModal(true);
                                  }
                                  return updated;
                                });
                                setActiveIndex((prev) =>
                                  getNextActiveIndexExcluding(prev, index)
                                );
                              }
                            }
                            return copy;
                          });
                          return;
                        }

                        pushHistory();
                        setPlayers((prev) =>
                          prev.map((p, i) =>
                            i === index ? { ...p, score: p.score + delta } : p
                          )
                        );
                      }}
                      className={[
                        "mt-4 flex w-full items-center justify-center rounded-xl py-6",
                        isActive ? "" : "pointer-events-none",
                      ].join(" ")}
                      aria-label={`${index + 1}번 선수 득점`}
                    >
                      {isCushion ? (
                        <div className="text-[32px] font-extrabold leading-none text-[#1fe85b]">
                          쿠션
                        </div>
                      ) : (
                        <div className="text-[40px] font-extrabold leading-none text-white">
                          {player.score}
                        </div>
                      )}
                    </button>

                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <div className="text-[11px] font-semibold text-white/70">
                          이닝
                        </div>
                        <div className="text-[14px] font-extrabold text-white">
                          {inningsValue}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] font-semibold text-white/70">
                          평균 득점
                        </div>
                        <div className="text-[14px] font-extrabold text-[#1fe85b]">
                          {Number.isFinite(avg) ? avg.toFixed(3) : "0.000"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Control Bar - 세로모드에서만 표시 */}
      <div
        className={[
          "fixed inset-x-0 bottom-0 bg-[#0b0b0b] pb-7",
          isLandscapeTwoPlayer && "landscape:hidden",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="mx-auto w-full max-w-[420px] px-6">
          <button
            type="button"
            onClick={() => {
              const nextIndex = getNextActiveIndex(activeIndex);
              pushHistory();
              setActiveIndex(nextIndex);
              setInnings((prev) => {
                const newInnings = [...prev];
                newInnings[nextIndex] = (prev[nextIndex] ?? 0) + 1;
                return newInnings;
              });
            }}
            className="mt-4 flex h-[60px] w-full items-center justify-center rounded-md bg-[#ff2d61] text-[24px] font-extrabold text-white"
          >
            턴 넘기기
          </button>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <button
              type="button"
              disabled={history.length === 0}
              onClick={() => {
                setHistory((prev) => {
                  if (prev.length === 0) return prev;
                  const last = prev[prev.length - 1];
                  setPlayers(last.players.map((p) => ({ ...p })));
                  setActiveIndex(last.activeIndex);
                  setInnings([...last.innings]);
                  setRemainingFinish([...last.remainingFinish]);
                  setCompletedRanks(last.completedRanks ?? []);
                  return prev.slice(0, -1);
                });
              }}
              className={[
                "flex h-[56px] items-center justify-center rounded-md text-[18px] font-extrabold",
                history.length === 0
                  ? "bg-[#3a3a3a] text-white/40"
                  : "bg-[#3a3a3a] text-white",
              ].join(" ")}
            >
              {"< 되돌리기"}
            </button>
            <button
              type="button"
              onClick={() => {
                pushHistory();
                setPlayers((prev) =>
                  prev.map((p, i) =>
                    i === activeIndex
                      ? { ...p, score: clampToNonNegative(p.score - delta) }
                      : p
                  )
                );
              }}
              className="flex h-[56px] items-center justify-center rounded-md bg-[#7b7b7b] text-[22px] font-extrabold text-white"
            >
              -{delta}
            </button>
            <button
              type="button"
              onClick={() => {
                const current = players[activeIndex];
                setWinnerName(current.name);
                setShowWinModal(true);
              }}
              className="flex h-[56px] items-center justify-center rounded-md bg-[#2a2a2a] text-[20px] font-extrabold text-white"
            >
              게임 종료
            </button>
          </div>
        </div>
      </div>

      {showWinModal && (
        <WinModal
          winnerName={winnerName}
          rankEntries={players.length >= 3 ? completedRanks : undefined}
          players={players}
          onResume={() => {
            if (history.length > 0) {
              const last = history[history.length - 1];
              setPlayers(last.players.map((p) => ({ ...p })));
              setActiveIndex(last.activeIndex);
              setInnings([...last.innings]);
              setRemainingFinish([...last.remainingFinish]);
              setCompletedRanks(last.completedRanks ?? []);
              setHistory((prev) => prev.slice(0, -1));
            }
            setShowWinModal(false);
          }}
          onGoHome={async () => {
            if (players.length < 2) {
              router.push("/");
              return;
            }

            const p1UserId = players[0]?.userId;
            if (!p1UserId) {
              console.log("게스트 모드에서는 기록이 저장되지 않습니다");
              router.push("/");
              return;
            }

            const myScore = players[0]?.score ?? 0;
            const myInnings = innings[0] ?? 0;

            if (players.length >= 3 && completedRanks.length > 0) {
              const myRank =
                completedRanks.find((e) => e.playerIndex === 0)?.rank ??
                players.length;
              const firstPlace = completedRanks.find((e) => e.rank === 1);
              const refScore =
                firstPlace !== undefined
                  ? players[firstPlace.playerIndex]?.score ?? 0
                  : 0;
              const uniqueByPlayer = completedRanks.filter(
                (e, i, arr) => arr.findIndex((x) => x.playerIndex === e.playerIndex) === i
              );
              const rankings = uniqueByPlayer
                .slice()
                .sort((a, b) => a.rank - b.rank)
                .map((e) => ({
                  playerIndex: e.playerIndex,
                  rank: e.rank,
                  name: players[e.playerIndex]?.name ?? `선수 ${e.playerIndex + 1}`,
                  score: players[e.playerIndex]?.score ?? 0,
                }));
              const ok = await saveMatch({
                myScore,
                opponentScore: 0,
                innings: myInnings,
                isWin: myRank === 1,
                secondPlaceScore: refScore,
                rankings,
                gameType,
              });
              if (ok) router.push("/");
              else alert("저장에 실패했습니다.");
            } else {
              const opponentScore = players[1]?.score ?? 0;
              const winnerIdx = players.findIndex((p) => p.name === winnerName);
              const isWin = winnerIdx === 0;
              const ok = await saveMatch({
                myScore,
                opponentScore,
                innings: myInnings,
                isWin,
                opponentName: players[1]?.name ?? null,
                gameType,
              });
              if (ok) router.push("/");
              else alert("저장에 실패했습니다.");
            }
          }}
        />
      )}
    </div>
  );
}

function PlayFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0b0b]">
      <div className="text-[18px] font-semibold text-white/70">로딩 중...</div>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<PlayFallback />}>
      <PlayContent />
    </Suspense>
  );
}

