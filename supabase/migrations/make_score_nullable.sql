-- score 컬럼 NOT NULL 제거 (score_4gu, score_3cushion 사용으로 마이그레이션)
-- Supabase SQL Editor에서 실행

ALTER TABLE profiles ALTER COLUMN score DROP NOT NULL;
