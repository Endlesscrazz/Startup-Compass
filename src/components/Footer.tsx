import Link from "next/link";
import { CompassMark } from "./CompassMark";

export function Footer() {
  return (
    <footer className="border-t border-rule/70 bg-surface">
      <div className="mx-auto w-full max-w-6xl px-6 py-14 sm:px-8">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-surface">
                <CompassMark className="h-5 w-5" />
              </span>
              <span className="font-display text-lg font-semibold tracking-tight text-ink">
                Startup Compass
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-ink-soft">
              The official front door to Utah&rsquo;s startup ecosystem. Built
              with the Utah Governor&rsquo;s Office of Economic Development.
            </p>
          </div>

          <FooterCol
            title="Products"
            links={[
              { label: "Founder's Navigator", href: "/navigator" },
              { label: "Utah Startup Map", href: "/map" },
            ]}
            className="md:col-span-2"
          />

          <FooterCol
            title="Resources"
            links={[
              {
                label: "startup.utah.gov",
                href: "https://startup.utah.gov",
                external: true,
              },
              {
                label: "GOED",
                href: "https://goed.utah.gov",
                external: true,
              },
              { label: "Add your company", href: "/map?claim=1" },
            ]}
            className="md:col-span-2"
          />

          <FooterCol
            title="About"
            links={[
              { label: "Privacy", href: "/privacy" },
              { label: "Accessibility", href: "/accessibility" },
              { label: "Contact", href: "mailto:hello@startupcompass.utah.gov" },
            ]}
            className="md:col-span-3"
          />
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-rule/70 pt-6 text-[12px] text-ink-mute sm:flex-row sm:items-center">
          <p>
            &copy; {new Date().getFullYear()} Startup Compass. An initiative of
            the State of Utah.
          </p>
          <p className="inline-flex items-center gap-2">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            Made in Utah
          </p>
        </div>
      </div>
    </footer>
  );
}

type FooterLink = { label: string; href: string; external?: boolean };

function FooterCol({
  title,
  links,
  className,
}: {
  title: string;
  links: FooterLink[];
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute">
        {title}
      </p>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] text-ink-soft hover:text-ink"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-[14px] text-ink-soft hover:text-ink"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
