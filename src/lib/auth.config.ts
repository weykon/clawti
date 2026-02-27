import type { NextAuthConfig } from 'next-auth';

// Edge-safe auth config — no Node.js imports (no pg, no crypto)
// Used by middleware.ts for session checking only
export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [], // Providers configured in auth.ts (server-only)
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.backendToken = (user as any).backendToken;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId as string;
      (session as any).backendToken = token.backendToken;
      return session;
    },
  },
};
