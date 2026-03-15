"use client";

import { createClient } from "@/lib/supabase/client";
import { getProfile } from "@/lib/profiles";
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
  const [profileNickname, setProfileNickname] = useState<string | null>(null);
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

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        setProfileNickname(profile?.nickname ?? null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then((p) => setProfileNickname(p?.nickname ?? null));
  }, [user?.id]);

  const displayName = profileNickname ?? (user ? getUserDisplayName(user) : "Jaehyuk");

  const handleUserClick = () => {
    if (user) {
      router.push("/onboarding");
    } else {
      router.push("/login");
    }
  };

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
        aria-label={isLoggedIn ? "프로필 수정" : "로그인"}
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
