import { createClient } from "@/lib/supabase/client";

export type Profile = {
  id: string;
  user_id: string;
  nickname: string;
  region: string;
  score: number;
  created_at: string;
  updated_at: string;
};

export const REGIONS = [
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "광주",
  "대전",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
  "기타",
] as const;

export type Region = (typeof REGIONS)[number];

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export type UpsertProfileParams = {
  userId: string;
  nickname: string;
  region: string;
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
      region: params.region,
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
