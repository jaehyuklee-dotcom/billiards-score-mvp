"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, Home as HomeIcon, Settings, Users } from "lucide-react";

function showToast(message: string) {
  const el = document.createElement("div");
  el.className =
    "fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-[#1a1a1a] px-5 py-3 text-sm font-medium text-white shadow-lg";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

const activeClass = "text-[#1fe85b] hover:text-[#1fe85b]";
const inactiveClass = "text-white/70 hover:text-white/90";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 items-center border-t border-white/10 bg-[#0b0b0b] py-4">
      <Link
        href="/"
        className={`flex flex-col items-center gap-1 ${pathname === "/" ? activeClass : inactiveClass}`}
      >
        <HomeIcon className="h-6 w-6" />
        <span className="text-[12px] font-medium">홈</span>
      </Link>
      <Link
        href="/history"
        className={`flex flex-col items-center gap-1 ${pathname === "/history" ? activeClass : inactiveClass}`}
      >
        <FileText className="h-6 w-6" />
        <span className="text-[12px] font-medium">기록</span>
      </Link>
      <Link
        href="/ranking"
        className={`flex flex-col items-center gap-1 ${pathname === "/ranking" ? activeClass : inactiveClass}`}
      >
        <BarChart3 className="h-6 w-6" />
        <span className="text-[12px] font-medium">랭킹</span>
      </Link>
      <Link
        href="/friends"
        className={`flex flex-col items-center gap-1 ${pathname === "/friends" ? activeClass : inactiveClass}`}
      >
        <Users className="h-6 w-6" />
        <span className="text-[12px] font-medium">친구</span>
      </Link>
      <button
        type="button"
        onClick={() => showToast("준비 중인 기능입니다")}
        className={`flex flex-col items-center gap-1 ${inactiveClass}`}
      >
        <Settings className="h-6 w-6" />
        <span className="text-[12px] font-medium">설정</span>
      </button>
    </nav>
  );
}
