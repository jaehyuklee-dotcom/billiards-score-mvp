"use client";

import { ChevronDown, Loader2, MapPin, Target, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getProfile,
  getRegionDong,
  getRegionGu,
  REGION_SI_LIST,
  upsertProfile,
} from "@/lib/profiles";

const SCORE_4GU_ALERT = "4구 점수는 10단위로만 입력 가능합니다. (예: 120, 150, 200)";
const SCORE_3CUSHION_ALERT = "3쿠션 평균 점을 입력해 주세요 (예: 0.5, 1.2)";

type KakaoPlace = {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string | null;
};

function isValidScore4gu(val: number): boolean {
  return Number.isFinite(val) && (val === 0 || (val > 0 && val % 10 === 0));
}

function isValidScore3cushion(val: number): boolean {
  return Number.isFinite(val) && val >= 0;
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
  const [score4guStr, setScore4guStr] = useState("");
  const [score3cushionStr, setScore3cushionStr] = useState("");
  const [favoriteClubName, setFavoriteClubName] = useState("");
  const [favoriteClubId, setFavoriteClubId] = useState("");
  const [favoriteClubAddress, setFavoriteClubAddress] = useState("");
  const [isManualFavoriteClub, setIsManualFavoriteClub] = useState(false);
  const [clubSearchQuery, setClubSearchQuery] = useState("");
  const [clubSearchResults, setClubSearchResults] = useState<KakaoPlace[]>([]);
  const [clubSearchLoading, setClubSearchLoading] = useState(false);
  const [clubSearchOpen, setClubSearchOpen] = useState(false);
  const [openSi, setOpenSi] = useState(false);
  const [openGu, setOpenGu] = useState(false);
  const [openDong, setOpenDong] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const siRef = useRef<HTMLDivElement>(null);
  const guRef = useRef<HTMLDivElement>(null);
  const dongRef = useRef<HTMLDivElement>(null);
  const clubSearchRef = useRef<HTMLDivElement>(null);

  const guOptions = regionSi ? getRegionGu(regionSi) : [];

  // 단골 당구장 검색 (debounced)
  const searchClubs = useCallback(async (query: string) => {
    if (!query.trim()) {
      setClubSearchResults([]);
      return;
    }
    setClubSearchLoading(true);
    try {
      const res = await fetch(`/api/kakao/search?query=${encodeURIComponent(query.trim())}`);
      const data = (await res.json()) as KakaoPlace[] | { error: string };
      if (Array.isArray(data)) {
        setClubSearchResults(data);
      } else {
        setClubSearchResults([]);
      }
    } catch {
      setClubSearchResults([]);
    } finally {
      setClubSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (clubSearchQuery.trim()) {
        searchClubs(clubSearchQuery);
      } else {
        setClubSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [clubSearchQuery, searchClubs]);
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
        setScore4guStr(profile.score_4gu != null ? String(profile.score_4gu) : "");
        setScore3cushionStr(profile.score_3cushion != null ? String(profile.score_3cushion) : "");
        setFavoriteClubName(profile.favorite_club_name || "");
        setFavoriteClubId(profile.favorite_club_id || "");
        setFavoriteClubAddress(profile.favorite_club_address || "");
        if (profile.favorite_club_id === "MANUAL" && profile.favorite_club_name) {
          setIsManualFavoriteClub(true);
        }
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
      if (clubSearchRef.current && !clubSearchRef.current.contains(t)) setClubSearchOpen(false);
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

  const score4gu = Number(score4guStr);
  const score3cushion = Number(score3cushionStr);
  const score4guValid = score4guStr === "" || isValidScore4gu(score4gu);
  const score3cushionValid = score3cushionStr === "" || isValidScore3cushion(score3cushion);
  const atLeastOneScore =
    (score4guStr !== "" && score4gu > 0) || (score3cushionStr !== "" && score3cushion >= 0);
  const canSubmit =
    nickname.trim().length > 0 &&
    regionSi !== "" &&
    regionGu !== "" &&
    regionDong !== "" &&
    score4guValid &&
    score3cushionValid &&
    atLeastOneScore &&
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
      score4gu: score4guStr && score4gu > 0 ? score4gu : null,
      score3cushion: score3cushionStr && score3cushion >= 0 ? score3cushion : null,
      favoriteClubName: favoriteClubName.trim() || null,
      favoriteClubId: favoriteClubName.trim() ? (isManualFavoriteClub ? "MANUAL" : favoriteClubId || null) : null,
      favoriteClubAddress: favoriteClubName.trim() ? (isManualFavoriteClub ? "" : favoriteClubAddress || null) : null,
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

          {/* 나의 단골 당구장 */}
          <div ref={clubSearchRef}>
            <label className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-white/90">
              <MapPin className="h-4 w-4 text-[#1fe85b]" />
              나의 단골 당구장
            </label>
            {isManualFavoriteClub ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={favoriteClubName}
                  onChange={(e) => setFavoriteClubName(e.target.value)}
                  placeholder="예: 역삼동 황금당구장"
                  className="h-14 w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 text-[16px] text-white placeholder:text-white/40 focus:border-[#1fe85b] focus:outline-none focus:ring-1 focus:ring-[#1fe85b]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsManualFavoriteClub(false);
                    setFavoriteClubName("");
                    setFavoriteClubId("");
                    setFavoriteClubAddress("");
                    setClubSearchQuery("");
                  }}
                  className="text-[12px] font-medium text-white/60 underline hover:text-[#1fe85b]"
                >
                  검색으로 다시 찾기
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={clubSearchOpen ? clubSearchQuery : (favoriteClubId ? favoriteClubName : clubSearchQuery)}
                    onChange={(e) => {
                      setClubSearchQuery(e.target.value);
                      setClubSearchOpen(true);
                      if (!e.target.value) {
                        setFavoriteClubName("");
                        setFavoriteClubId("");
                        setFavoriteClubAddress("");
                      }
                    }}
                    onFocus={() => setClubSearchOpen(true)}
                    placeholder="지역명 또는 당구장 이름 검색"
                    className="h-14 flex-1 rounded-xl border border-white/10 bg-[#1a1a1a] px-4 text-[16px] text-white placeholder:text-white/40 focus:border-[#1fe85b] focus:outline-none focus:ring-1 focus:ring-[#1fe85b]"
                  />
                </div>
                {clubSearchOpen && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-[#1a1a1a] shadow-xl">
                    {clubSearchLoading && (
                      <div className="flex items-center justify-center gap-2 px-4 py-6 text-[14px] text-white/60">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        검색 중...
                      </div>
                    )}
                    {!clubSearchLoading && clubSearchQuery.trim() && clubSearchResults.length === 0 && (
                      <div className="px-4 py-6 text-center text-[14px] text-white/50">
                        검색 결과가 없습니다
                      </div>
                    )}
                    {!clubSearchLoading && clubSearchResults.length > 0 && (
                      <div className="py-1">
                        {clubSearchResults.map((place) => (
                          <button
                            key={place.id}
                            type="button"
                            onClick={() => {
                              setFavoriteClubName(place.place_name);
                              setFavoriteClubId(place.id);
                              setFavoriteClubAddress(place.road_address_name || place.address_name);
                              setClubSearchQuery("");
                              setClubSearchOpen(false);
                            }}
                            className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-white/5"
                          >
                            <span className="text-[14px] font-medium text-white">{place.place_name}</span>
                            <span className="text-[12px] text-white/60">
                              {place.road_address_name || place.address_name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {!clubSearchLoading && clubSearchQuery.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsManualFavoriteClub(true);
                          setFavoriteClubName(clubSearchQuery);
                          setFavoriteClubId("MANUAL");
                          setFavoriteClubAddress("");
                          setClubSearchQuery("");
                          setClubSearchOpen(false);
                        }}
                        className="flex w-full items-center gap-2 border-t border-white/10 px-4 py-3 text-[14px] font-medium text-[#1fe85b] hover:bg-white/5"
                      >
                        직접 입력: &quot;{clubSearchQuery}&quot; 당구장
                      </button>
                    )}
                  </div>
                )}
                {favoriteClubName && favoriteClubId && !clubSearchOpen && (
                  <p className="mt-1.5 text-[12px] text-[#1fe85b]">
                    ✓ {favoriteClubName}
                    {favoriteClubAddress && ` · ${favoriteClubAddress}`}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsManualFavoriteClub(true);
                    setFavoriteClubName("");
                    setFavoriteClubId("");
                    setFavoriteClubAddress("");
                    setClubSearchQuery("");
                    setClubSearchOpen(false);
                  }}
                  className="mt-2 text-[12px] font-medium text-white/60 underline hover:text-[#1fe85b]"
                >
                  직접 입력하기 (예: OO동 OO당구장)
                </button>
              </div>
            )}
            <p className="mt-1.5 text-[12px] text-white/50">
              단골 당구장을 검색하거나 직접 입력할 수 있습니다
            </p>
          </div>

          {/* 당구 점수 - 4구 / 3쿠션 */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-white/90">
              <Target className="h-4 w-4 text-[#1fe85b]" />
              현재 당구 점수
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="score-4gu" className="mb-1.5 block text-[12px] font-medium text-white/70">
                  4구
                </label>
                <input
                  id="score-4gu"
                  type="number"
                  inputMode="numeric"
                  value={score4guStr}
                  onChange={(e) => setScore4guStr(e.target.value)}
                  placeholder="예: 150"
                  min={0}
                  step={10}
                  className={`h-12 w-full rounded-xl border px-4 text-[16px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 ${
                    score4guValid
                      ? "border-white/10 bg-[#1a1a1a] focus:border-[#1fe85b] focus:ring-[#1fe85b]"
                      : "border-red-500/50 bg-[#1a1a1a] focus:border-red-500 focus:ring-red-500"
                  }`}
                />
              </div>
              <div>
                <label htmlFor="score-3cushion" className="mb-1.5 block text-[12px] font-medium text-white/70">
                  3쿠션
                </label>
                <input
                  id="score-3cushion"
                  type="number"
                  inputMode="numeric"
                  value={score3cushionStr}
                  onChange={(e) => setScore3cushionStr(e.target.value)}
                  placeholder="예: 0.5"
                  min={0}
                  step={0.1}
                  className={`h-12 w-full rounded-xl border px-4 text-[16px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 ${
                    score3cushionValid
                      ? "border-white/10 bg-[#1a1a1a] focus:border-[#1fe85b] focus:ring-[#1fe85b]"
                      : "border-red-500/50 bg-[#1a1a1a] focus:border-red-500 focus:ring-red-500"
                  }`}
                />
              </div>
            </div>
            {!score4guValid && score4guStr !== "" && (
              <p className="mt-1.5 text-[12px] text-red-400">{SCORE_4GU_ALERT}</p>
            )}
            {!score3cushionValid && score3cushionStr !== "" && (
              <p className="mt-1 text-[12px] text-red-400">{SCORE_3CUSHION_ALERT}</p>
            )}
            <p className="mt-1.5 text-[12px] text-white/50">
              4구: 10점 단위 / 3쿠션: 평균 점 (소수 가능) · 하나 이상 입력
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
                : nickname || regionSi || score4guStr || score3cushionStr
                  ? "저장하기"
                  : "시작하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
