// Konfigurasi NextAuth v5 (Auth.js) — CredentialsProvider + Google OAuth + bcrypt.
// Session strategy "jwt" (wajib untuk credentials provider).
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { findActiveUserByEmail, findActiveUserByIdentifier } from "@/lib/user";

// Batasi login Google hanya untuk domain sekolah (opsional). Diparse sekali
// saat module load (env tidak berubah di runtime). Kosong = tanpa batasan.
const GOOGLE_ALLOWED_DOMAINS = (process.env.GOOGLE_ALLOWED_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  // Deploy di balik reverse proxy (Coolify/Traefik). Auth.js v5 default hanya
  // percaya localhost; tanpa ini login gagal dengan "UntrustedHost". trustHost
  // membuatnya mempercayai Host/X-Forwarded-Host dari domain publik kita.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    // Login Google. Hanya mengizinkan email yang SUDAH terdaftar sebagai User
    // aktif (dibuat Admin) — tidak ada auto-create, supaya role/gender/profil
    // guru tetap dikontrol admin. Filter email domain opsional via env
    // GOOGLE_ALLOWED_DOMAINS (koma) untuk membatasi ke domain sekolah.
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "Username atau Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier = credentials?.identifier;
        const password = credentials?.password;
        if (typeof identifier !== "string" || typeof password !== "string") {
          return null;
        }

        // Cari User berdasarkan username ATAU email (semua di-lowercase supaya
        // login case-insensitive konsisten di SQLite-dev & MariaDB-prod).
        const user = await findActiveUserByIdentifier(identifier);
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
    // Gerbang login Google: tolak bila email belum terdaftar sebagai User aktif,
    // atau (opsional) bukan dari domain sekolah yang diizinkan.
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user?.email?.toLowerCase();
        if (!email) return false;

        if (GOOGLE_ALLOWED_DOMAINS.length) {
          const domain = email.split("@")[1] ?? "";
          if (!GOOGLE_ALLOWED_DOMAINS.includes(domain)) return false;
        }

        // Existence gate di sini supaya kalau ditolak, user di-redirect ke
        // /login?error=AccessDenied (pesan ramah) — bukan sesi tanpa role.
        const dbUser = await findActiveUserByEmail(email);
        if (!dbUser) return false;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // `user` & `account` hanya ada saat signIn; simpan ke token.
      if (account?.provider === "google" && user?.email) {
        // Profile Google tidak membawa role/gender/id DB → muat dari DB.
        // Sekaligus override token.name dengan User.nama (bukan display name
        // Google) supaya konsisten dengan path credentials.
        const dbUser = await findActiveUserByEmail(user.email);
        if (!dbUser) return null; // fail closed: hapus sesi, bukan token tanpa role
        token.id = dbUser.id;
        token.role = dbUser.role;
        token.gender = dbUser.gender ?? null;
        token.name = dbUser.nama;
        token.email = dbUser.email;
      } else if (user) {
        // Credentials: id/role/gender/name sudah disisipkan authorize().
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