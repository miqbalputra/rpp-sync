// Seed data awal (PRD §10 Tahap 1): 1 Admin, 1 Mapel contoh, 1 Kelas contoh.
// Jalankan: npm run db:seed
//
// PRODUKSI (NODE_ENV=production):
//   - Password admin diambil dari env ADMIN_PASSWORD (WAJIB diset di Coolify).
//   - Data contoh (Mapel "Al-Qur'an" & Kelas "1 Ikhwan") HANYA dibuat bila
//     SEED_DEMO=true. Default: hanya admin.
// DEV: password default "admin123" + data contoh dibuat (sesuai perilaku lama).
import { PrismaClient, Role, Gender } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const isProd = process.env.NODE_ENV === "production";
const seedDemo = process.env.SEED_DEMO === "true";

async function main() {
  console.log(`Seeding data awal... (mode: ${isProd ? "production" : "development"})`);

  // 1 Admin
  const rawPassword = process.env.ADMIN_PASSWORD ?? "admin123";
  if (isProd && !process.env.ADMIN_PASSWORD) {
    console.warn(
      "⚠ ADMIN_PASSWORD tidak diset di environment produksi — fallback ke password lemah. Set ADMIN_PASSWORD di Coolify!",
    );
  }
  const adminPassword = await bcrypt.hash(rawPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@gqtunasilmu.sch.id" },
    // Reset password admin ke ADMIN_PASSWORD setiap deploy. Sebelumnya `update: {}`
    // membekukan password dari deploy pertama — mengganti ADMIN_PASSWORD di env lalu
    // redeploy TIDAK mengubah password admin yang sudah ada → terkunci. Dengan ini,
    // ADMIN_PASSWORD jadi source of truth: ubah di Coolify, redeploy, login pakai nilai
    // itu. Catatan: redeploy akan menimpa password yg admin ubah lewat UI Pengaturan.
    update: { passwordHash: adminPassword },
    create: {
      nama: "Administrator",
      email: "admin@gqtunasilmu.sch.id",
      username: "admin",
      passwordHash: adminPassword,
      role: Role.ADMIN,
      aktif: true,
    },
  });
  console.log(`✔ Admin: ${admin.email} (username: admin, password: ${isProd ? "(dari env ADMIN_PASSWORD — direset tiap deploy)" : "admin123"})`);

  // Data contoh hanya di dev, atau di prod bila SEED_DEMO=true.
  if (!isProd || seedDemo) {
    const mapel = await prisma.mapel.upsert({
      where: { namaMapel: "Al-Qur'an" },
      update: {},
      create: { namaMapel: "Al-Qur'an" },
    });
    console.log(`✔ Mapel contoh: ${mapel.namaMapel}`);

    const kelas = await prisma.kelas.upsert({
      where: { id: "kelas-contoh-ikhwan-1" },
      update: {},
      create: {
        id: "kelas-contoh-ikhwan-1",
        namaKelas: "1 Ikhwan",
        semester: "Ganjil",
        gender: Gender.IKHWAN,
        tahunAjaran: "2026/2027",
      },
    });
    console.log(`✔ Kelas contoh: ${kelas.namaKelas} (${kelas.gender})`);

    // Guru contoh: untuk demo login username (case-insensitive). Username
    // disimpan lowercase; coba login dengan "GURU01", "guru01", dll.
    const guruPassword = await bcrypt.hash("guru123", 10);
    const guruUser = await prisma.user.upsert({
      where: { email: "guru01@gqtunasilmu.sch.id" },
      update: {},
      create: {
        nama: "Guru Demo",
        email: "guru01@gqtunasilmu.sch.id",
        username: "guru01",
        passwordHash: guruPassword,
        role: Role.GURU,
        gender: Gender.IKHWAN,
        aktif: true,
      },
    });
    // Profil Guru wajib ada untuk role GURU.
    await prisma.guru.upsert({
      where: { userId: guruUser.id },
      update: {},
      create: { userId: guruUser.id, namaTampil: guruUser.nama },
    });
    console.log(
      `✔ Guru contoh: ${guruUser.email} (username: guru01, password: ${isProd ? "(guru123)" : "guru123"})`,
    );
  } else {
    console.log("ℹ Data contoh dilewati (SEED_DEMO!=true). Buat mapel/kelas/penugasan via UI Admin.");
  }

  console.log("Seed selesai.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });