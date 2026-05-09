import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

const demoAuthAllowed =
  process.env.DEMO_AUTH_DISABLED !== "true" &&
  process.env.DEMO_AUTH_DISABLED !== "1";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleAuthConfigured = Boolean(googleClientId && googleClientSecret);

/** Exposed to the login page so the Google button is hidden when OAuth is not configured. */
export function isGoogleAuthConfigured(): boolean {
  return googleAuthConfigured;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  // Required on Vercel / behind proxies — avoids "Host must be trusted" → /api/auth/error
  trustHost: true,
  // Persist OAuth users when DATABASE_URL is set; JWT works for Credentials (demo) without a User row.
  adapter: isDatabaseConfigured() ? PrismaAdapter(prisma) : undefined,
  session: { strategy: "jwt" },
  providers: [
    ...(googleAuthConfigured
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
    Credentials({
      id: "demo",
      name: "Demo",
      credentials: {},
      authorize: async () => {
        if (!demoAuthAllowed) return null;
        return {
          id: "demo-founder",
          name: "Demo Founder",
          email: "demo@startupcompass.local",
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
      },
    }),
  },
});
