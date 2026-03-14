import { createClient } from "@/lib/supabase/client";

export type SaveMatchParams = {
  myScore: number;
  opponentScore: number;
  innings: number;
  isWin: boolean;
};

export async function saveMatch(params: SaveMatchParams): Promise<boolean> {
  const { myScore, opponentScore, innings, isWin } = params;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("matches").insert({
    user_id: user?.id ?? null,
    my_score: myScore,
    opponent_score: opponentScore,
    innings,
    is_win: isWin,
  });

  if (error) {
    console.error("saveMatch error:", error);
    return false;
  }
  return true;
}
