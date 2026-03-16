-- matches 테이블 생성 및 RLS 정책
-- Supabase SQL Editor에서 실행 (테이블이 이미 있으면 스킵)

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  my_score INTEGER NOT NULL DEFAULT 0,
  opponent_score INTEGER NOT NULL DEFAULT 0,
  innings INTEGER NOT NULL DEFAULT 0,
  is_win BOOLEAN NOT NULL DEFAULT false,
  opponent_name TEXT,
  game_type TEXT DEFAULT '4',
  rankings JSONB,
  club_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있으면 무시 (수동으로 정책 삭제 후 재생성 필요)
DROP POLICY IF EXISTS "Users can read own matches" ON matches;
DROP POLICY IF EXISTS "Users can insert own matches" ON matches;

CREATE POLICY "Users can read own matches"
  ON matches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own matches"
  ON matches FOR INSERT
  WITH CHECK (auth.uid() = user_id);
