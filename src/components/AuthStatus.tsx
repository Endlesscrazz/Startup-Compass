"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Use on Utah flag blue header (white text). Default is for light backgrounds. */
  variant?: "light" | "dark";
};

export function AuthStatus({ variant = "light" }: Props) {
  const { data: session, status } = useSession();
  const dark = variant === "dark";
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, closeMenu]);

  if (status === "loading") {
    return (
      <div
        className={cn(
          "h-8 w-8 animate-pulse rounded-full",
          dark ? "bg-white/20" : "bg-surface-tint",
        )}
      />
    );
  }

  if (!session) {
    return (
      <>
        <Link
          href="/login"
          className={cn(
            "text-[13px] font-medium",
            dark ? "text-white/90 hover:text-white" : "text-ink-soft hover:text-ink",
          )}
        >
          Log in
        </Link>
        <Link
          href="/login"
          className={cn(
            "text-[13px] font-medium",
            dark ? "text-white/90 hover:text-white" : "text-ink-soft hover:text-ink",
          )}
        >
          Sign up
        </Link>
      </>
    );
  }

  const menuLinkClass = cn(
    "block w-full px-4 py-2.5 text-left text-[13px] font-medium transition-colors whitespace-normal",
    dark
      ? "text-white/95 hover:bg-white/10"
      : "text-ink hover:bg-surface-tint",
  );

  return (
    <div ref={wrapRef} className="relative flex items-center">
      <button
        type="button"
        className={cn(
          "profile-menu-trigger flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[13px] font-semibold transition-colors",
          dark
            ? "border-white/30 bg-white/5 text-white hover:bg-white/10"
            : "border-rule bg-surface-elev text-ink hover:bg-surface-tint",
        )}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-controls="account-profile-menu"
        id="account-profile-button"
        onClick={() => setMenuOpen((o) => !o)}
      >
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt=""
            width={28}
            height={28}
            className="rounded-full border border-white/25"
          />
        ) : (
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/25",
              dark ? "bg-white/15" : "bg-surface-tint",
            )}
            aria-hidden="true"
          >
            <svg
              className={cn("h-4 w-4", dark ? "text-white/90" : "text-ink-soft")}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
        )}
        <span className="max-w-[9rem] truncate">{session.user?.name ?? "Profile"}</span>
        <svg
          className={cn(
            "h-4 w-4 shrink-0 opacity-80 transition-transform duration-200",
            menuOpen && "rotate-180",
          )}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {menuOpen ? (
        <div
          id="account-profile-menu"
          role="menu"
          aria-labelledby="account-profile-button"
          className={cn(
            "absolute end-0 top-[calc(100%+8px)] z-[200] w-max min-w-[220px] max-w-[min(280px,calc(100vw-1.5rem))] rounded-xl border-2 py-1 shadow-xl",
            dark
              ? "border-gold bg-utah-blue text-white"
              : "border-gold bg-surface-elev text-ink shadow-[var(--shadow-card)]",
          )}
        >
          <Link href="/dashboard" role="menuitem" className={menuLinkClass} onClick={closeMenu}>
            Dashboard
          </Link>
          <Link href="/watchlist" role="menuitem" className={menuLinkClass} onClick={closeMenu}>
            Watchlist
          </Link>
          <Link href="/briefs-alerts" role="menuitem" className={menuLinkClass} onClick={closeMenu}>
            Briefs &amp; Alerts
          </Link>
          <div
            className={cn("my-1 h-px", dark ? "bg-white/15" : "bg-rule")}
            role="separator"
          />
          <button
            type="button"
            role="menuitem"
            className={cn(menuLinkClass, "w-full text-left")}
            onClick={() => {
              closeMenu();
              void signOut({ callbackUrl: "/" });
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
