-- region 컬럼 NOT NULL 제거 (region_si, region_gu, region_dong 사용으로 마이그레이션)
-- Supabase SQL Editor에서 실행

ALTER TABLE profiles ALTER COLUMN region DROP NOT NULL;
