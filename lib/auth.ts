// Konfigurasi NextAuth v5 (Auth.js) — CredentialsProvider + bcrypt.
// Session strategy "jwt" (wajib untuk credentials provider).
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user || !user.aktif) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // Sisipkan info penting ke token via JWT callback.
        return {
          id: user.id,
          name: user.nama,
          email: user.email,
          role: user.role,
          gender: user.gender,
        } as const;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // `user` hanya ada saat signIn; simpan ke token.
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.gender = (user as any).gender ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).gender = token.gender ?? null;
      }
      return session;
    },
  },
});

// Helper redirect setelah login berdasarkan role.
export function redirectPathForRole(role: string | undefined): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "GURU":
      return "/guru";
    case "KEPALA_SEKOLAH":
      return "/kepala";
    case "PJ_DINIYYAH":
      return "/pj";
    default:
      return "/login";
  }
}