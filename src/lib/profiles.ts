import { createClient } from "@/lib/supabase/client";
import { REGION_HIERARCHY, REGION_SI, getRegionGu, getRegionDong } from "./region-data";

export type Profile = {
  id: string;
  user_id: string;
  nickname: string;
  region_si: string;
  region_gu: string;
  region_dong: string;
  score_4gu: number | null;
  score_3cushion: number | null;
  favorite_club_name: string | null;
  favorite_club_id: string | null;
  favorite_club_address: string | null;
  created_at: string;
  updated_at: string;
};

/** @deprecated 기존 region 컬럼 호환용 - 신규는 region_si/gu/dong 사용 */
export type ProfileLegacy = Profile & { region?: string };

export const REGION_SI_LIST = REGION_SI;
export { getRegionGu, getRegionDong, REGION_HIERARCHY };

/** 닉네임 중복 여부 조회. true = 사용 가능, false = 중복 */
export async function checkNicknameDuplicate(
  nickname: string,
  excludeUserId?: string
): Promise<{ duplicate: boolean }> {
  const trimmed = nickname.trim();
  if (!trimmed) return { duplicate: true };

  const supabase = createClient();
  let query = supabase
    .from("profiles")
    .select("id")
    .ilike("nickname", trimmed);

  if (excludeUserId) {
    query = query.neq("user_id", excludeUserId);
  }

  const { data } = await query.limit(1);
  return { duplicate: (data?.length ?? 0) > 0 };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  const p = data as Record<string, unknown>;
  // 기존 region만 있는 레코드 마이그레이션
  if (p.region && !p.region_si) {
    return {
      ...(p as Profile),
      region_si: String(p.region),
      region_gu: "",
      region_dong: "",
    } as Profile;
  }
  // 기존 score 컬럼 마이그레이션
  if (p.score != null && p.score_4gu == null && p.score_3cushion == null) {
    return {
      ...(p as Profile),
      score_4gu: Number(p.score) || null,
      score_3cushion: null,
    } as Profile;
  }
  return p as Profile;
}

export type UpsertProfileParams = {
  userId: string;
  nickname: string;
  regionSi: string;
  regionGu: string;
  regionDong: string;
  score4gu: number | null;
  score3cushion: number | null;
  favoriteClubName: string | null;
  favoriteClubId: string | null;
  favoriteClubAddress: string | null;
};

export async function upsertProfile(
  params: UpsertProfileParams
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: params.userId,
      nickname: params.nickname.trim(),
      region_si: params.regionSi,
      region_gu: params.regionGu,
      region_dong: params.regionDong,
      score_4gu: params.score4gu,
      score_3cushion: params.score3cushion,
      favorite_club_name: params.favoriteClubName,
      favorite_club_id: params.favoriteClubId,
      favorite_club_address: params.favoriteClubAddress,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("upsertProfile error:", error);
    return { error: new Error(error.message) };
  }
  return { error: null };
}
