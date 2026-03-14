import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  FileText,
  Home as HomeIcon,
  Play,
  Settings,
  Target,
  Trophy,
  User,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-24 pt-10">
        {/* Header */}
        <header className="flex w-full items-center justify-between">
          <h1 className="text-[26px] font-extrabold leading-tight text-white">
            안녕하세요,
            <br />
            <span className="text-[#1fe85b]">Jaehyuk</span>님!
          </h1>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1fe85b]/20">
            <User className="h-6 w-6 text-[#1fe85b]" aria-hidden="true" />
          </div>
        </header>

        {/* Dashboard Cards */}
        <section className="mt-10 flex flex-1 flex-col gap-5">
          {/* 1. 이닝 당 평균 득점 */}
          <div className="w-full rounded-2xl border border-white/5 bg-[#1a1a1a] p-6">
            <div className="flex items-center gap-3">
              <BarChart3
                className="h-6 w-6 text-[#1fe85b]"
                aria-hidden="true"
              />
              <h2 className="text-[14px] font-semibold text-white/90">
                이닝 당 평균 득점
              </h2>
            </div>
            <div className="mt-5 text-[56px] font-black leading-none tracking-tight text-[#1fe85b]">
              1.247
            </div>
            <p className="mt-2 text-[12px] font-medium text-white/50">
              최근 30 게임 기준으로 계산됩니다.
            </p>
          </div>

          {/* 2. 목표 점수 */}
          <div className="w-full rounded-2xl border border-white/5 bg-[#1a1a1a] p-6">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-[#1fe85b]" aria-hidden="true" />
              <h2 className="text-[14px] font-semibold text-white/90">
                목표 점수
              </h2>
            </div>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-[56px] font-black leading-none tracking-tight text-white">
                400점
              </span>
              <span className="text-[14px] font-medium text-white/50">(4구)</span>
            </div>
          </div>

          {/* 3. 하단 그리드 */}
          <div className="grid w-full grid-cols-2 gap-5">
            <div className="w-full rounded-2xl border border-white/5 bg-[#1a1a1a] p-6">
              <div className="flex items-center gap-3">
                <Trophy
                  className="h-6 w-6 text-[#1fe85b]"
                  aria-hidden="true"
                />
                <h2 className="text-[14px] font-semibold text-white/90">승률</h2>
              </div>
              <div className="mt-5 text-[56px] font-black leading-none tracking-tight text-[#1fe85b]">
                67%
              </div>
            </div>
            <div className="w-full rounded-2xl border border-white/5 bg-[#1a1a1a] p-6">
              <div className="flex items-center gap-3">
                <CalendarDays
                  className="h-6 w-6 text-[#1fe85b]"
                  aria-hidden="true"
                />
                <h2 className="text-[14px] font-semibold text-white/90">
                  이번 주 게임 수
                </h2>
              </div>
              <div className="mt-5 text-[56px] font-black leading-none tracking-tight text-[#1fe85b]">
                12
              </div>
            </div>
          </div>
        </section>

        {/* 게임 시작 버튼 */}
        <div className="w-full pb-6 pt-6">
          <Link
            href="/setup"
            className="flex h-[76px] w-full items-center justify-center gap-4 rounded-2xl bg-[#1fe85b] text-[26px] font-black tracking-tight text-[#0b0b0b] shadow-[0_0_48px_rgba(31,232,91,0.5),0_0_24px_rgba(31,232,91,0.4)]"
          >
            <Play className="h-8 w-8 text-[#0b0b0b]" aria-hidden="true" />
            게임 시작
          </Link>
        </div>
      </div>

      {/* 하단 메뉴바 */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-white/10 bg-[#0b0b0b] py-4"
        aria-label="하단 메뉴"
      >
        <Link
          href="/"
          className="flex flex-col items-center gap-1 text-[#1fe85b]"
          aria-current="page"
        >
          <HomeIcon className="h-6 w-6" aria-hidden="true" />
          <span className="text-[12px] font-medium">홈</span>
        </Link>
        <Link
          href="/history"
          className="flex flex-col items-center gap-1 text-white/70 hover:text-white/90"
        >
          <FileText className="h-6 w-6" aria-hidden="true" />
          <span className="text-[12px] font-medium">기록</span>
        </Link>
        <Link
          href="/ranking"
          className="flex flex-col items-center gap-1 text-white/70 hover:text-white/90"
        >
          <BarChart3 className="h-6 w-6" aria-hidden="true" />
          <span className="text-[12px] font-medium">랭킹</span>
        </Link>
        <Link
          href="/setup"
          className="flex flex-col items-center gap-1 text-white/70 hover:text-white/90"
        >
          <Settings className="h-6 w-6" aria-hidden="true" />
          <span className="text-[12px] font-medium">설정</span>
        </Link>
      </nav>
    </div>
  );
}
