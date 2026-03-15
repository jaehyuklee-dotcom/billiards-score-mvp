-- profiles 테이블에 region_si, region_gu, region_dong 컬럼 추가
-- Supabase 대시보드 → SQL Editor에서 실행

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region_si TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region_gu TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region_dong TEXT DEFAULT '';

-- 기존 region 컬럼이 있으면 값 복사 (선택)
-- UPDATE profiles SET region_si = COALESCE(region, '') WHERE region_si IS NULL OR region_si = '';
