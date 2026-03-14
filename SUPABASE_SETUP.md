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

## 6. Vercel 배포 시

Vercel 프로젝트 → **Settings** → **Environment Variables**에 `.env.local`과 동일한 변수 추가:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
