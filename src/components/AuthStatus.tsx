"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export function AuthStatus() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-surface-tint"></div>;
  }

  if (!session) {
    return (
      <>
        <Link href="/login" className="text-[13px] font-medium text-ink-soft hover:text-ink">
          Log in
        </Link>
        <Link href="/login" className="signup">
          Sign up
        </Link>
      </>
    );
  }

  return (
    <div className="relative group flex items-center gap-4">
      <Link href="/dashboard" className="text-[13px] font-medium text-ink-mute hover:text-ink transition-colors hidden md:block">
        Dashboard
      </Link>
      <div className="text-right hidden md:block">
        <p className="text-[13px] font-medium text-ink leading-tight">{session.user?.name}</p>
        <button 
          onClick={() => signOut()}
          className="text-[11px] text-ink-mute hover:text-accent transition-colors"
        >
          Sign out
        </button>
      </div>
      {session.user?.image ? (
        <Image
          src={session.user.image}
          alt={session.user.name ?? "User"}
          width={32}
          height={32}
          className="rounded-full border border-rule"
        />
      ) : (
        <div className="h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center text-[13px] font-bold">
          {session.user?.name?.[0] ?? "U"}
        </div>
      )}
    </div>
  );
}
