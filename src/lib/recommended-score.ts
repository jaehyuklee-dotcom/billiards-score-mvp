const MIN_SCORE = 50;
const MAX_SCORE = 2000;
const DEFAULT_SCORE = 50;
const INNINGS_STANDARD = 15;

/**
 * 평균 에버리지 × 15를 기준으로 권장 점수를 계산합니다. (15이닝 완료 기준)
 *
 * 표시 규칙:
 * - 500점 이하: 50단위 반올림 (예: 124 → 100, 126 → 150)
 * - 500점 초과: 100단위 반올림 (예: 549 → 500, 551 → 600)
 * - 최솟값 50점, 최대 2000점 제한
 */
export function getRecommendedScore(
  averageEverAge: number | null | undefined,
  isLoading = false
): number {
  if (isLoading || averageEverAge == null || !Number.isFinite(averageEverAge)) {
    return DEFAULT_SCORE;
  }

  const rawScore = averageEverAge * INNINGS_STANDARD;
  let rounded: number;

  if (rawScore <= 500) {
    rounded = Math.round(rawScore / 50) * 50;
  } else {
    rounded = Math.round(rawScore / 100) * 100;
  }

  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, rounded));
}
