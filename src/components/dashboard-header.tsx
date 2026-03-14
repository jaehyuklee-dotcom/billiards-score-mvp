"use client";

import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { User as UserIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function getUserDisplayName(user: User): string {
  const name =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0];
  return name?.trim() || "사용자";
}

function DashboardHeaderInner() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserClick = async () => {
    try {
      const supabase = createClient();
      if (user) {
        await supabase.auth.signOut();
        router.refresh();
      } else {
        const { data } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (data?.url) {
          window.location.href = data.url;
        }
      }
    } catch {
      alert("Supabase 설정이 필요합니다. .env.local을 확인해 주세요.");
    }
  };

  const displayName = user ? getUserDisplayName(user) : "Jaehyuk";
  const isLoggedIn = !!user;

  return (
    <header className="flex w-full items-center justify-between">
      <h1 className="text-[26px] font-extrabold leading-tight text-white">
        안녕하세요,
        <br />
        <span className="text-[#1fe85b]">
          {loading ? "..." : displayName}
        </span>
        님!
      </h1>
      <button
        type="button"
        onClick={handleUserClick}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1fe85b]/20 transition-opacity hover:opacity-90"
        aria-label={isLoggedIn ? "로그아웃" : "구글 로그인"}
      >
        <UserIcon className="h-6 w-6 text-[#1fe85b]" aria-hidden="true" />
      </button>
    </header>
  );
}

function HeaderSkeleton() {
  return (
    <header className="flex w-full items-center justify-between">
      <h1 className="text-[26px] font-extrabold leading-tight text-white">
        안녕하세요,
        <br />
        <span className="text-[#1fe85b]">Jaehyuk</span>님!
      </h1>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1fe85b]/20">
        <UserIcon className="h-6 w-6 text-[#1fe85b]" aria-hidden="true" />
      </div>
    </header>
  );
}

export const DashboardHeader = dynamic(
  () => Promise.resolve(DashboardHeaderInner),
  { ssr: false, loading: () => <HeaderSkeleton /> }
);
