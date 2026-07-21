// Proteksi route berdasarkan role (PRD §4.1, Tahap 2).
// Next.js 16: konvensi "proxy.ts" (pengganti "middleware.ts").
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Path prefix -> role yang diizinkan.
const ROLE_ROUTES: { prefix: string; roles: string[] }[] = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/guru", roles: ["GURU"] },
  { prefix: "/kepala", roles: ["KEPALA_SEKOLAH"] },
  { prefix: "/pj", roles: ["PJ_DINIYYAH"] },
  { prefix: "/jadwal", roles: ["ADMIN", "PJ_DINIYYAH"] },
  { prefix: "/akun", roles: ["ADMIN", "GURU", "KEPALA_SEKOLAH", "PJ_DINIYYAH"] },
  { prefix: "/notifikasi", roles: ["ADMIN", "GURU", "KEPALA_SEKOLAH", "PJ_DINIYYAH"] },
];

const PUBLIC_PATHS = ["/login", "/akses-ditolak"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;
  const isLoggedIn = !!session?.user;

  // Endpoint NextAuth & asset statis: lewat.
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Root: kalau login arahkan ke dashboard role, kalau belum ke login.
  if (pathname === "/") {
    if (isLoggedIn && role) {
      const dest = dashboardFor(role);
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Halaman publik.
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    // Kalau sudah login & buka /login, redirect ke dashboard.
    if (pathname === "/login" && isLoggedIn && role) {
      return NextResponse.redirect(new URL(dashboardFor(role), req.url));
    }
    return NextResponse.next();
  }

  // Route yang butuh login.
  const matched = ROLE_ROUTES.find(
    (r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/")
  );
  if (matched) {
    if (!isLoggedIn) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (!role || !matched.roles.includes(role)) {
      return NextResponse.redirect(new URL("/akses-ditolak", req.url));
    }
    return NextResponse.next();
  }

  // Default: kalau ada route lain yang tidak dipetakan & belum login, lempar ke login.
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
});

function dashboardFor(role: string): string {
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

export const config = {
  // Jalankan proxy untuk semua route kecuali asset statis & file export publik (PRD §5.2 share).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|exports).*)"],
};