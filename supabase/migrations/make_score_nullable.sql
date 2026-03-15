-- score 컬럼 NOT NULL 제거 (score_4gu, score_3cushion 사용으로 마이그레이션)
-- Supabase 대시보드 → SQL Editor에서 반드시 실행

ALTER TABLE profiles ALTER COLUMN score DROP NOT NULL;

-- 기존 NULL 행이 있으면 0으로 채움 (선택)
-- UPDATE profiles SET score = 0 WHERE score IS NULL;
