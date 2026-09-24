import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const normalizedEmail = (credentials.email as string).trim().toLowerCase();

        const userRecord = await db.query.users.findFirst({
          where: sql`lower(${users.email}) = ${normalizedEmail}`,
        });

        if (!userRecord || !userRecord.passwordHash) {
          return null;
        }

        const isMatch = await bcrypt.compare(credentials.password as string, userRecord.passwordHash);
        
        if (!isMatch) {
          return null;
        }

        return { id: userRecord.id, email: userRecord.email, name: userRecord.name };
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub || token.id) as string;
      }
      return session;
    }
  }
});
