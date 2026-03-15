# Supabase 구글 로그인 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속 후 로그인
2. **New Project** 클릭
3. 프로젝트 이름, 비밀번호 입력 후 **Create new project** 실행
4. 프로젝트 생성 완료 후 대시보드 진입

## 2. 환경 변수 설정

1. Supabase 대시보드 → **Project Settings** → **API**
2. **Project URL** 복사
3. **Project API keys** → **anon** (public) 키 복사
4. 프로젝트 루트에 `.env.local` 파일 생성 후 아래 내용 입력:

```env
NEXT_PUBLIC_SUPABASE_URL=여기에_Project_URL_붙여넣기
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_anon_키_붙여넣기
```

## 3. 구글 OAuth 설정 (Supabase)

1. Supabase 대시보드 → **Authentication** → **Providers**
2. **Google** 클릭 후 **Enable** 활성화
3. Google Cloud Console에서 Client ID, Client Secret 발급 (아래 4번 참고)
4. Client ID, Client Secret을 Supabase에 입력 후 **Save**

## 4. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택 → **APIs & Services** → **Credentials**
3. **Create Credentials** → **OAuth client ID**
4. Application type: **Web application** 선택
5. **Authorized JavaScript origins**에 추가:
   - `http://localhost:3000` (개발용)
   - `https://yourdomain.com` (배포 도메인)
6. **Authorized redirect URIs**에 Supabase 콜백 URL 추가:
   - Supabase 대시보드 → Authentication → URL Configuration에서 **Redirect URLs** 확인
   - 형식: `https://<프로젝트_ref>.supabase.co/auth/v1/callback`
   - 예: `https://abcdefgh.supabase.co/auth/v1/callback`
7. **Create** 후 Client ID, Client Secret 복사하여 Supabase에 입력

## 5. Supabase Redirect URL 설정

1. Supabase 대시보드 → **Authentication** → **URL Configuration**
2. **Redirect URLs**에 앱 콜백 URL 추가:
   - `http://localhost:3000/auth/callback` (개발용)
   - `https://yourdomain.com/auth/callback` (배포용)

## 6. 카카오 OAuth 설정 (선택)

1. [카카오 개발자 콘솔](https://developers.kakao.com/)에서 앱 생성
2. REST API 키, Kakao Login Client Secret 발급
3. Supabase 대시보드 → **Authentication** → **Providers** → **Kakao** 활성화 후 입력
4. Redirect URL: `https://<프로젝트_ref>.supabase.co/auth/v1/callback`

## 7. profiles 테이블 - 온보딩(프로필) 정보

온보딩 페이지에서 수집한 닉네임, 활동 지역(시/구/동), 당구 점수를 저장합니다.

```sql
-- profiles 테이블 생성 (신규)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  region_si TEXT NOT NULL,
  region_gu TEXT NOT NULL,
  region_dong TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score > 0 AND score % 10 = 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- [기존 profiles 테이블에 region 컬럼만 있는 경우] 아래 마이그레이션 실행:
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region_si TEXT DEFAULT '';
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region_gu TEXT DEFAULT '';
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region_dong TEXT DEFAULT '';
-- UPDATE profiles SET region_si = COALESCE(region, ''), region_gu = '', region_dong = '' WHERE region_si IS NULL OR region_si = '';

-- RLS 정책: 본인만 읽기/쓰기
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

## 8. matches 테이블 - 3인 이상 경기 순위 저장 (선택)

3인 이상 경기 시 순위 정보를 저장하려면 matches 테이블에 `rankings` 컬럼을 추가하세요:

```sql
ALTER TABLE matches ADD COLUMN IF NOT EXISTS rankings JSONB;
```

형식: `[{ "playerIndex": 0, "rank": 1, "name": "이름", "score": 400 }, ...]`

## 9. Vercel 배포 시

Vercel 프로젝트 → **Settings** → **Environment Variables**에 `.env.local`과 동일한 변수 추가:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
