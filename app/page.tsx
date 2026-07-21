import { redirect } from "next/navigation";

// Root: proxy.ts sudah arahkan sesuai sesi. Fallback redirect ke login jika terlewati.
export default function Home() {
  redirect("/login");
}