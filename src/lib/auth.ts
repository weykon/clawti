import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { queryOne } from './db';
import { verifyPassword, signJwt } from './authUtils';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = (credentials.email as string)?.toLowerCase().trim();
        const password = credentials.password as string;
        if (!email || !password) return null;

        const row = await queryOne<{ id: string; email: string; username: string; password_hash: string }>(
          'SELECT id, email, username, password_hash FROM users WHERE email = $1',
          [email]
        );
        if (!row) return null;

        const valid = await verifyPassword(password, row.password_hash);
        if (!valid) return null;

        const token = signJwt({ userId: row.id, email: row.email });
        return {
          id: row.id,
          email: row.email,
          name: row.username,
          backendToken: token,
        };
      },
    }),
  ],
});
