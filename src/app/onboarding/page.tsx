"use client";

import { ChevronDown, User, MapPin, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getProfile,
  getRegionDong,
  getRegionGu,
  REGION_SI_LIST,
  upsertProfile,
} from "@/lib/profiles";

const SCORE_ALERT_MSG =
  "당구 점수는 10단위로만 입력 가능합니다. (예: 120, 150, 200)";

function isValidScore10(val: number): boolean {
  return Number.isFinite(val) && val > 0 && val % 10 === 0;
}

function SelectWrapper({
  value,
  placeholder,
  open,
  onToggle,
  onSelect,
  options,
  selectRef,
  className = "",
}: {
  value: string;
  placeholder: string;
  open: boolean;
  onToggle: () => void;
  onSelect: (v: string) => void;
  options: string[];
  selectRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
}) {
  return (
    <div className="relative" ref={selectRef}>
        <button
          type="button"
          onClick={onToggle}
          className={`flex h-14 w-full items-center justify-between rounded-xl border border-white/10 bg-[#1a1a1a] px-4 text-left text-[16px] focus:border-[#1fe85b] focus:outline-none focus:ring-1 focus:ring-[#1fe85b] ${className}`}
        >
          <span className={value ? "text-white" : "text-white/40"}>
            {value || placeholder}
          </span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-white/60 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && options.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-[#1a1a1a] py-1 shadow-xl">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onSelect(opt);
                  onToggle();
                }}
                className={`block w-full px-4 py-3 text-left text-[14px] hover:bg-white/5 ${value === opt ? "font-semibold text-[#1fe85b]" : "text-white/90"}`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [nickname, setNickname] = useState("");
  const [regionSi, setRegionSi] = useState("");
  const [regionGu, setRegionGu] = useState("");
  const [regionDong, setRegionDong] = useState("");
  const [scoreStr, setScoreStr] = useState("");
  const [openSi, setOpenSi] = useState(false);
  const [openGu, setOpenGu] = useState(false);
  const [openDong, setOpenDong] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const siRef = useRef<HTMLDivElement>(null);
  const guRef = useRef<HTMLDivElement>(null);
  const dongRef = useRef<HTMLDivElement>(null);

  const guOptions = regionSi ? getRegionGu(regionSi) : [];
  const dongOptions = regionSi && regionGu ? getRegionDong(regionSi, regionGu) : [];

  // 로그인 체크 및 기존 프로필 데이터 로드
  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const profile = await getProfile(user.id);
      if (profile) {
        setNickname(profile.nickname);
        setRegionSi(profile.region_si || "");
        setRegionGu(profile.region_gu || "");
        setRegionDong(profile.region_dong || "");
        setScoreStr(String(profile.score));
      }
    }
    load();
  }, [router, supabase.auth]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (siRef.current && !siRef.current.contains(t)) setOpenSi(false);
      if (guRef.current && !guRef.current.contains(t)) setOpenGu(false);
      if (dongRef.current && !dongRef.current.contains(t)) setOpenDong(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSiSelect = (v: string) => {
    setRegionSi(v);
    setRegionGu("");
    setRegionDong("");
  };
  const handleGuSelect = (v: string) => {
    setRegionGu(v);
    setRegionDong("");
  };

  const score = Number(scoreStr);
  const scoreValid = scoreStr === "" || isValidScore10(score);
  const canSubmit =
    nickname.trim().length > 0 &&
    regionSi !== "" &&
    regionGu !== "" &&
    regionDong !== "" &&
    scoreValid &&
    score > 0 &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!canSubmit) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    setSubmitting(true);
    const { error } = await upsertProfile({
      userId: user.id,
      nickname: nickname.trim(),
      regionSi,
      regionGu,
      regionDong,
      score,
    });

    setSubmitting(false);
    if (error) {
      setErrorMsg(error.message || "저장에 실패했습니다. 다시 시도해 주세요.");
      return;
    }
    router.replace("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0b0b0b] text-white">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-[26px] font-extrabold leading-tight text-white">
            당신은 어떤 고수인가요?
          </h1>
          <p className="mt-3 text-[14px] font-medium text-white/60">
            나만의 프로필을 완성해 보세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6">
          {/* 닉네임 */}
          <div>
            <label
              htmlFor="nickname"
              className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-white/90"
            >
              <User className="h-4 w-4 text-[#1fe85b]" />
              닉네임
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="예: 당구천재"
              maxLength={20}
              className="h-14 w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 text-[16px] text-white placeholder:text-white/40 focus:border-[#1fe85b] focus:outline-none focus:ring-1 focus:ring-[#1fe85b]"
              autoComplete="nickname"
            />
            <p className="mt-1.5 text-[12px] text-white/50">
              다른 사용자에게 보여질 이름입니다
            </p>
          </div>

          {/* 활동 지역 - 시/구/동 */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-white/90">
              <MapPin className="h-4 w-4 text-[#1fe85b]" />
              활동 지역
            </label>
            <div className="grid grid-cols-3 gap-2">
              <SelectWrapper
                value={regionSi}
                placeholder="시·도"
                open={openSi}
                onToggle={() => setOpenSi((v) => !v)}
                onSelect={handleSiSelect}
                options={REGION_SI_LIST}
                selectRef={siRef}
              />
              <SelectWrapper
                value={regionGu}
                placeholder="시·군·구"
                open={openGu}
                onToggle={() => setOpenGu((v) => !v)}
                onSelect={handleGuSelect}
                options={guOptions}
                selectRef={guRef}
                className={!regionSi ? "opacity-60" : ""}
              />
              <SelectWrapper
                value={regionDong}
                placeholder="동·읍·면"
                open={openDong}
                onToggle={() => setOpenDong((v) => !v)}
                onSelect={setRegionDong}
                options={dongOptions}
                selectRef={dongRef}
                className={!regionGu ? "opacity-60" : ""}
              />
            </div>
            <p className="mt-1.5 text-[12px] text-white/50">
              시·도 → 시·군·구 → 동·읍·면 순으로 선택해 주세요
            </p>
          </div>

          {/* 당구 점수 */}
          <div>
            <label
              htmlFor="score"
              className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-white/90"
            >
              <Target className="h-4 w-4 text-[#1fe85b]" />
              현재 당구 점수
            </label>
            <input
              id="score"
              type="number"
              inputMode="numeric"
              value={scoreStr}
              onChange={(e) => setScoreStr(e.target.value)}
              placeholder="예: 150"
              min={10}
              step={10}
              className={`h-14 w-full rounded-xl border px-4 text-[16px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 ${
                scoreValid
                  ? "border-white/10 bg-[#1a1a1a] focus:border-[#1fe85b] focus:ring-[#1fe85b]"
                  : "border-red-500/50 bg-[#1a1a1a] focus:border-red-500 focus:ring-red-500"
              }`}
            />
            {!scoreValid && scoreStr !== "" && (
              <p className="mt-1.5 text-[12px] text-red-400">{SCORE_ALERT_MSG}</p>
            )}
            <p className="mt-1.5 text-[12px] text-white/50">
              4구 기준, 10점 단위로 입력해 주세요
            </p>
          </div>

          {errorMsg && (
            <p className="rounded-lg bg-red-500/20 px-4 py-3 text-[14px] text-red-400">
              {errorMsg}
            </p>
          )}

          <div className="mt-auto pt-4">
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-14 w-full items-center justify-center rounded-xl bg-[#1fe85b] text-[16px] font-bold text-[#0b0b0b] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "저장 중..."
                : nickname || regionSi || scoreStr
                  ? "저장하기"
                  : "시작하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
