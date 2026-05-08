import Link from "next/link";
import { CompassMark } from "./CompassMark";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full bg-surface/80 backdrop-blur-md">
      <div className="border-b border-rule/70">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2.5"
            aria-label="Startup Compass — Home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-surface transition-transform duration-300 group-hover:rotate-45">
              <CompassMark className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-[17px] font-semibold tracking-tight text-ink">
                Startup Compass
              </span>
              <span className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-ink-mute">
                Utah · Founder Platform
              </span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-8 md:flex"
            aria-label="Primary"
          >
            <Link
              href="/navigator"
              className="text-sm font-medium text-ink-soft hover:text-ink"
            >
              Navigator
            </Link>
            <Link
              href="/map"
              className="text-sm font-medium text-ink-soft hover:text-ink"
            >
              Startup Map
            </Link>
            <a
              href="https://startup.utah.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-ink-soft hover:text-ink"
            >
              startup.utah.gov
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="#products"
              className="hidden h-10 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-surface transition-colors hover:bg-ink-soft sm:inline-flex"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
