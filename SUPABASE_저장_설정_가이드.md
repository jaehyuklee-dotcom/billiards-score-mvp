# 저장 실패 해결 가이드

경기 기록 저장이 안 될 때, **Supabase 대시보드에서만** 아래 작업을 하면 됩니다.  
로컬에 Supabase를 따로 설치하거나 실행할 필요는 없습니다.

---

## 1단계: Supabase 대시보드 접속

1. https://supabase.com/dashboard 접속
2. 로그인 후 **해당 프로젝트** 선택

---

## 2단계: matches 테이블 확인

1. 왼쪽 메뉴에서 **Table Editor** 클릭
2. `matches` 테이블이 있는지 확인

### 2-A. matches 테이블이 **없는** 경우

1. 왼쪽 메뉴 **SQL Editor** 클릭
2. **New query** 선택
3. 아래 전체 SQL을 붙여넣고 **Run** 실행:

```sql
CREATE TABLE matches (
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

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own matches"
  ON matches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own matches"
  ON matches FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 2-B. matches 테이블이 **있는** 경우

1. **SQL Editor**에서 아래 쿼리만 실행해서 필수 컬럼 추가:

```sql
ALTER TABLE matches ADD COLUMN IF NOT EXISTS opponent_name TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS game_type TEXT DEFAULT '4';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS rankings JSONB;
```

---

## 3단계: RLS 정책 확인 (저장 실패 시)

matches 테이블이 이미 있는데 계속 저장이 실패하면, RLS 정책이 없거나 잘못되었을 수 있습니다.

1. **SQL Editor**에서 아래 쿼리 실행:

```sql
-- 기존 INSERT 정책 삭제 (에러 나면 무시)
DROP POLICY IF EXISTS "Users can insert own matches" ON matches;

-- 새로 INSERT 정책 생성
CREATE POLICY "Users can insert own matches"
  ON matches FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## 체크리스트

| 순서 | 해야 할 것 | 위치 |
|------|------------|------|
| 1 | Supabase 대시보드 접속 | supabase.com |
| 2 | matches 테이블 만들기 또는 컬럼 추가 | SQL Editor |
| 3 | RLS INSERT 정책 확인/추가 | SQL Editor |

---

## 환경 변수 확인

프로젝트에 Supabase URL과 Anon Key가 설정되어 있어야 합니다.

- 로컬: `.env.local` 파일
- Vercel: 프로젝트 Settings → Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Supabase 대시보드 → **Project Settings** → **API** 에서 확인할 수 있습니다.
