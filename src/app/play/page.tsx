"use client";

import { ChevronLeft, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function clampToNonNegative(n: number) {
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

type WinModalProps = {
  winnerName: string;
  onResume: () => void;
};

function WinModal({ winnerName, onResume }: WinModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b0b0b]/95">
      <div className="mx-auto flex w-full max-w-[420px] flex-col items-center justify-center px-6 pb-24">
        <Trophy className="h-24 w-24 text-yellow-400" aria-hidden="true" />

        <div className="mt-10 text-center text-[44px] font-extrabold leading-[1.1] text-white">
          {winnerName}님이
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
};

type GameState = {
  players: PlayerRuntime[];
  activeIndex: number;
  innings: number[];
  remainingFinish: number[];
};

export default function PlayPage() {
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
  });

  const pushHistory = () => {
    setHistory((prev) => [...prev, snapshot()]);
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <main className="mx-auto min-h-screen w-full max-w-[420px] pb-[172px]">
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
                            setWinnerName(current.name);
                            setShowWinModal(true);
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
                const isFirstRow = index === 0 || index === 1;
                const remainingScore = Math.max(0, player.target - player.score);
                const remainingFinishCount = remainingFinish[index] ?? 0;
                const isCushion = player.score >= player.target;

                return (
                  <div
                    key={player.id}
                    className={[
                      "rounded-2xl bg-[#1a1a1a] px-4 py-4",
                      !isFirstRow ? "mt-2" : "",
                      isActive
                        ? `border border-white/25 ${
                            glowClasses[index] ?? glowClasses[0]
                          }`
                        : "opacity-40",
                    ].join(" ")}
                  >
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
                              setWinnerName(current.name);
                              setShowWinModal(true);
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

      {/* Control Bar */}
      <div className="fixed inset-x-0 bottom-0 bg-[#0b0b0b] pb-7">
        <div className="mx-auto w-full max-w-[420px] px-6">
          <button
            type="button"
            onClick={() => {
              const nextIndex = (activeIndex + 1) % players.length;
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
          onResume={() => setShowWinModal(false)}
        />
      )}
    </div>
  );
}

