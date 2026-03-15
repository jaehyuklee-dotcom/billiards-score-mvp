-- matches 테이블에 opponent_name, game_type 컬럼 추가
-- Supabase SQL Editor에서 실행

ALTER TABLE matches ADD COLUMN IF NOT EXISTS opponent_name TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS game_type TEXT DEFAULT '4';
