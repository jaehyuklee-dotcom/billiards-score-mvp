"use client";

import { ChevronLeft, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

type PlayerSetup = {
  id: number;
  name: string;
  target: string;
  guest?: boolean;
  finish?: string;
};

const SCORE_ALERT_MSG =
  "당구 점수는 10단위로만 입력 가능합니다. (예: 120, 150, 200)";

function isValidScore10(val: number): boolean {
  return Number.isFinite(val) && val > 0 && val % 10 === 0;
}

export default function SetupPage() {
  const router = useRouter();

  const [gameType, setGameType] = useState<"3" | "4">("4");

  const [players, setPlayers] = useState<PlayerSetup[]>([
    { id: 1, name: "1번 선수", target: "400", guest: false, finish: "1" },
    { id: 2, name: "2번 선수", target: "400", guest: false, finish: "1" },
  ]);

  const [p1LoadRecent, setP1LoadRecent] = useState(true);
  const [finishSameForAll, setFinishSameForAll] = useState(true);

  const targetInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handlePlayerChange = (
    index: number,
    field: "name" | "target" | "finish",
    value: string
  ) => {
    setPlayers((prev) => {
      if (field === "finish" && index === 0 && finishSameForAll) {
        return prev.map((p) => ({ ...p, finish: value }));
      }
      return prev.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      );
    });
  };

  const showScoreError = (index: number): boolean => {
    const raw = players[index]?.target;
    if (raw === "" || raw === undefined) return false;
    const val = Number(raw);
    return !isValidScore10(val);
  };

  const validateAllScores = (): number | null => {
    for (let i = 0; i < players.length; i++) {
      const val = Number(players[i]?.target);
      if (!isValidScore10(val)) return i;
    }
    return null;
  };

  const handleAddPlayer = () => {
    setPlayers((prev) => {
      if (prev.length >= 6) return prev;
      const nextId = prev.length + 1;
      const baseFinish = finishSameForAll ? prev[0]?.finish ?? "1" : "1";
      return [
        ...prev,
        {
          id: nextId,
          name: `${nextId}번 선수`,
          target: "400",
          guest: false,
          finish: baseFinish,
        },
      ];
    });
  };

  const handleGuestToggle = (index: number, checked: boolean) => {
    setPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, guest: checked } : p))
    );
  };

  const playerLabelBgClasses = [
    "bg-orange-500",
    "bg-blue-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-teal-500",
  ] as const;

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <main className="mx-auto w-full max-w-[420px] px-6 pb-16 pt-10">
        <header className="space-y-6">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#d9d9d9]/70"
            aria-label="뒤로"
            onClick={() => router.push("/")}
          >
            <ChevronLeft className="h-5 w-5 text-black/60" aria-hidden="true" />
          </button>

          <div className="space-y-3">
            <div className="text-[24px] font-extrabold text-white">경기 세팅</div>
            <p className="text-[13px] font-medium text-white/70">
              멤버를 선택하시면 권장 점수가 기본으로 세팅됩니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setGameType("3")}
              className={[
                "h-[74px] rounded-xl text-[26px] font-extrabold",
                gameType === "3"
                  ? "bg-[#1fe85b] text-[#0b0b0b]"
                  : "bg-[#1a1a1a] text-white",
              ].join(" ")}
            >
              3구
            </button>
            <button
              type="button"
              onClick={() => setGameType("4")}
              className={[
                "h-[74px] rounded-xl text-[26px] font-extrabold",
                gameType === "4"
                  ? "bg-[#1fe85b] text-[#0b0b0b]"
                  : "bg-[#1a1a1a] text-white",
              ].join(" ")}
            >
              4구
            </button>
          </div>
        </header>

        <section className="mt-8 space-y-6">
          <div className="rounded-2xl border border-[#ff6a3d] bg-[#1a1a1a] px-5 py-5">
            <div className="flex items-start justify-between">
              <div
                className={`rounded-md px-4 py-2 text-[16px] font-extrabold text-white ${playerLabelBgClasses[0]}`}
              >
                1번 선수
              </div>
              <label className="flex items-center gap-2 pt-1 text-[13px] font-semibold text-white/70">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded-[4px] border border-white/60 bg-neutral-900 accent-white"
                  checked={p1LoadRecent}
                  onChange={(e) => setP1LoadRecent(e.target.checked)}
                />
                최근 내 기록 불러오기
              </label>
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <div className="text-[14px] font-semibold text-white/60">
                  닉네임
                </div>
                <input
                  value={players[0]?.name ?? ""}
                  onChange={(e) => handlePlayerChange(0, "name", e.target.value)}
                  className="h-12 w-full rounded-md bg-black/35 px-4 text-[18px] font-extrabold text-white outline-none"
                />
              </div>
              <div className="space-y-2">
                <div className="text-[14px] font-semibold text-white/60">
                  점수
                </div>
                <input
                  ref={(el) => {
                    targetInputRefs.current[0] = el;
                  }}
                  value={players[0]?.target ?? ""}
                  onChange={(e) => handlePlayerChange(0, "target", e.target.value)}
                  inputMode="numeric"
                  className="h-12 w-full rounded-md bg-black/35 px-4 text-[18px] font-extrabold text-white outline-none"
                />
                {showScoreError(0) && (
                  <p className="text-[12px] font-medium text-red-400">
                    10단위 점수만 입력 가능합니다
                  </p>
                )}
              </div>
              {gameType === "4" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="text-[14px] font-semibold text-white/60">
                      마무리
                    </div>
                    <label className="flex items-center gap-2 text-[13px] font-medium text-white/70">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded-[4px] border border-white/60 bg-neutral-900 accent-white"
                        checked={finishSameForAll}
                        onChange={(e) => setFinishSameForAll(e.target.checked)}
                      />
                      모든 선수 동일
                    </label>
                  </div>
                  <input
                    value={players[0]?.finish ?? "1"}
                    onChange={(e) =>
                      handlePlayerChange(0, "finish", e.target.value)
                    }
                    inputMode="numeric"
                    className="h-12 w-full rounded-md bg-black/35 px-4 text-[18px] font-extrabold text-white outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#3b82f6] bg-[#1a1a1a] px-5 py-5">
            <div className="flex items-start justify-between">
              <div
                className={`rounded-md px-4 py-2 text-[16px] font-extrabold text-white ${playerLabelBgClasses[1]}`}
              >
                2번 선수
              </div>
              <label className="flex items-center gap-2 pt-1 text-[13px] font-semibold text-white/70">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded-[4px] border border-white/60 bg-neutral-900 accent-white"
                  checked={!!players[1]?.guest}
                  onChange={(e) => handleGuestToggle(1, e.target.checked)}
                />
                게스트
              </label>
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <div className="text-[14px] font-semibold text-white/60">
                  닉네임
                </div>
                <input
                  value={players[1]?.name ?? ""}
                  onChange={(e) => handlePlayerChange(1, "name", e.target.value)}
                  className="h-12 w-full rounded-md bg-black/35 px-4 text-[18px] font-extrabold text-white outline-none"
                />
              </div>
              <div className="space-y-2">
                <div className="text-[14px] font-semibold text-white/60">
                  점수
                </div>
                <input
                  ref={(el) => {
                    targetInputRefs.current[1] = el;
                  }}
                  value={players[1]?.target ?? ""}
                  onChange={(e) => handlePlayerChange(1, "target", e.target.value)}
                  inputMode="numeric"
                  className="h-12 w-full rounded-md bg-black/35 px-4 text-[18px] font-extrabold text-white outline-none"
                />
                {showScoreError(1) && (
                  <p className="text-[12px] font-medium text-red-400">
                    10단위 점수만 입력 가능합니다
                  </p>
                )}
              </div>
              {gameType === "4" && (
                <div className="space-y-2">
                  <div className="text-[14px] font-semibold text-white/60">
                    마무리
                  </div>
                  <input
                    value={players[1]?.finish ?? "1"}
                    onChange={(e) =>
                      handlePlayerChange(1, "finish", e.target.value)
                    }
                    inputMode="numeric"
                    className="h-12 w-full rounded-md bg-black/35 px-4 text-[18px] font-extrabold text-white outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {players.slice(2).map((player, index) => {
            const displayIndex = index + 3;
            return (
              <div
                key={player.id}
                className="rounded-2xl border border-white/20 bg-[#151515] px-5 py-5"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`rounded-md px-4 py-2 text-[15px] font-extrabold text-white ${
                      playerLabelBgClasses[displayIndex - 1] ?? "bg-white/10"
                    }`}
                  >
                    {displayIndex}번 선수
                  </div>
                  <label className="flex items-center gap-2 pt-1 text-[13px] font-semibold text-white/70">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded-[4px] border border-white/60 bg-neutral-900 accent-white"
                      checked={!!player.guest}
                      onChange={(e) =>
                        handleGuestToggle(index + 2, e.target.checked)
                      }
                    />
                    게스트
                  </label>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="space-y-2">
                    <div className="text-[14px] font-semibold text-white/60">
                      닉네임
                    </div>
                    <input
                      value={player.name}
                      onChange={(e) =>
                        handlePlayerChange(index + 2, "name", e.target.value)
                      }
                      className="h-12 w-full rounded-md bg-black/35 px-4 text-[18px] font-extrabold text-white outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="text-[14px] font-semibold text-white/60">
                      점수
                    </div>
                    <input
                      ref={(el) => {
                        targetInputRefs.current[index + 2] = el;
                      }}
                      value={player.target}
                      onChange={(e) =>
                        handlePlayerChange(index + 2, "target", e.target.value)
                      }
                      inputMode="numeric"
                      className="h-12 w-full rounded-md bg-black/35 px-4 text-[18px] font-extrabold text-white outline-none"
                    />
                    {showScoreError(index + 2) && (
                      <p className="text-[12px] font-medium text-red-400">
                        10단위 점수만 입력 가능합니다
                      </p>
                    )}
                  </div>
                  {gameType === "4" && (
                    <div className="space-y-2">
                      <div className="text-[14px] font-semibold text-white/60">
                        마무리
                      </div>
                      <input
                        value={player.finish ?? "1"}
                        onChange={(e) =>
                          handlePlayerChange(index + 2, "finish", e.target.value)
                        }
                        inputMode="numeric"
                        className="h-12 w-full rounded-md bg-black/35 px-4 text-[18px] font-extrabold text-white outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div className="mt-4 flex gap-3">
            {players.length < 6 && (
              <button
                type="button"
                onClick={handleAddPlayer}
                className="flex h-12 flex-1 items-center justify-center rounded-xl border border-dashed border-white/25 text-[14px] font-semibold text-white/80"
              >
                + 선수 추가
              </button>
            )}
            {players.length > 2 && (
              <button
                type="button"
                onClick={() =>
                  setPlayers((prev) =>
                    prev.length > 2 ? prev.slice(0, prev.length - 1) : prev
                  )
                }
                className="flex h-12 flex-1 items-center justify-center rounded-xl border border-white/25 text-[14px] font-semibold text-white/70"
              >
                - 선수 삭제
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={!canStart}
            onClick={() => {
              const invalidIdx = validateAllScores();
              if (invalidIdx !== null) {
                alert(SCORE_ALERT_MSG);
                targetInputRefs.current[invalidIdx]?.focus();
                return;
              }

              const parsed = players.map((p) => ({
                ...p,
                t: Number(p.target),
                f: Number(p.finish ?? 1),
              }));

              if (parsed.some((p) => !Number.isInteger(p.f) || p.f <= 0)) {
                alert("마무리 값은 1 이상의 자연수로 입력해 주세요.");
                return;
              }

              const cleanedPlayers = parsed.map((p) => ({
                id: p.id,
                name: p.name.trim(),
                target: p.t,
                finish: p.f,
              }));

              const params = new URLSearchParams({
                g: gameType,
                players: JSON.stringify(cleanedPlayers),
              });
              router.push(`/play?${params.toString()}`);
            }}
            className={[
              "mt-8 flex h-[78px] w-full items-center justify-center gap-4 rounded-2xl text-[26px] font-extrabold",
              canStart
                ? "bg-[#1fe85b] text-[#0b0b0b]"
                : "bg-[#1fe85b]/50 text-[#0b0b0b]/70",
            ].join(" ")}
          >
            <Play className="h-7 w-7 text-[#0b0b0b]" aria-hidden="true" />
            게임 시작
          </button>
        </section>
      </main>
    </div>
  );
}

