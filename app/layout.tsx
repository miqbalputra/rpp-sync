import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { SidebarProvider } from "@/context/SidebarContext";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit-app",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sinkronisasi RPP — Griya Qur'an Tunas Ilmu",
  description:
    "Aplikasi sinkronisasi Rencana Pelaksanaan Pembelajaran untuk Griya Qur'an Tunas Ilmu, Purbalingga.",
};

// Mencegah flash-of-incorrect-theme (FOUC): set kelas .dark sebelum catat sesuai preferensi tersimpan.
const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${outfit.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full font-outfit">
        <ThemeProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}