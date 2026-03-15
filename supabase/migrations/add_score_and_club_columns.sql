-- profiles 테이블에 score_4gu, score_3cushion, 단골 당구장 컬럼 추가
-- Supabase 대시보드 → SQL Editor에서 실행

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS score_4gu INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS score_3cushion INTEGER;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_club_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_club_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_club_address TEXT;
