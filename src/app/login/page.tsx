import { AtlasHeader } from "@/components/AtlasPages";
import { isGoogleAuthConfigured } from "@/auth";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  const googleAuthEnabled = isGoogleAuthConfigured();

  return (
    <div className="atlas-page atlas-page-light flex min-h-0 flex-1 flex-col">
      <AtlasHeader />
      <div className="flex flex-1 flex-col items-center justify-center bg-surface-elev px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-rule bg-surface p-8 text-center shadow-[var(--shadow-card)]">
          <h1 className="mb-2 font-display text-[24px] font-bold text-ink">
            Welcome to Startup Compass
          </h1>
          <p className="mb-8 text-[14px] text-ink-mute">
            Sign in to save your watchlist, briefs, and alert preferences.
          </p>
          <LoginForm googleAuthEnabled={googleAuthEnabled} />
        </div>
      </div>
    </div>
  );
}
