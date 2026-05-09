import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const demoAuthAllowed =
  process.env.DEMO_AUTH_DISABLED !== "true" &&
  process.env.DEMO_AUTH_DISABLED !== "1";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
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
