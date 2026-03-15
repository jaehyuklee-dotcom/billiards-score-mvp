import { createClient } from "@/lib/supabase/client";

export type RankingEntry = {
  playerIndex: number;
  rank: number;
  name: string;
  score: number;
};

export type SaveMatchParams = {
  myScore: number;
  opponentScore: number;
  innings: number;
  isWin: boolean;
  /** 3인 이상일 때 2등 점수 (opponent_score로 저장) */
  secondPlaceScore?: number;
  /** 3인 이상일 때 전체 순위 정보 (목표 달성 순서) */
  rankings?: RankingEntry[];
  /** 2인전 상대 이름 */
  opponentName?: string | null;
  /** 3구 | 4구 */
  gameType?: "3" | "4";
};

export async function saveMatch(params: SaveMatchParams): Promise<boolean> {
  const {
    myScore,
    opponentScore,
    innings,
    isWin,
    secondPlaceScore,
    rankings,
    opponentName,
    gameType,
  } = params;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const resolvedOpponentScore =
    secondPlaceScore !== undefined ? secondPlaceScore : opponentScore;

  const insertData: Record<string, unknown> = {
    user_id: user?.id ?? null,
    my_score: myScore,
    opponent_score: resolvedOpponentScore,
    innings,
    is_win: isWin,
  };
  if (rankings && rankings.length > 0) {
    insertData.rankings = rankings;
  }
  if (opponentName != null) {
    insertData.opponent_name = opponentName;
  }
  if (gameType) {
    insertData.game_type = gameType;
  }

  const { error } = await supabase.from("matches").insert(insertData);

  if (error) {
    console.error("saveMatch error:", error);
    return false;
  }
  return true;
}
