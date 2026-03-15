import { createClient } from "@/lib/supabase/client";
import { REGION_HIERARCHY, REGION_SI, getRegionGu, getRegionDong } from "./region-data";

export type Profile = {
  id: string;
  user_id: string;
  nickname: string;
  region_si: string;
  region_gu: string;
  region_dong: string;
  score: number;
  created_at: string;
  updated_at: string;
};

/** @deprecated 기존 region 컬럼 호환용 - 신규는 region_si/gu/dong 사용 */
export type ProfileLegacy = Profile & { region?: string };

export const REGION_SI_LIST = REGION_SI;
export { getRegionGu, getRegionDong, REGION_HIERARCHY };

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
  return p as Profile;
}

export type UpsertProfileParams = {
  userId: string;
  nickname: string;
  regionSi: string;
  regionGu: string;
  regionDong: string;
  score: number;
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
      score: params.score,
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
