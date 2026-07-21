// Seed data awal (PRD §10 Tahap 1): 1 Admin, 1 Mapel contoh, 1 Kelas contoh.
// Jalankan: npm run db:seed
import { PrismaClient, Role, Gender } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding data awal...");

  // 1 Admin
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@gqtunasilmu.sch.id" },
    update: {},
    create: {
      nama: "Administrator",
      email: "admin@gqtunasilmu.sch.id",
      username: "admin",
      passwordHash: adminPassword,
      role: Role.ADMIN,
      aktif: true,
    },
  });
  console.log(`✔ Admin: ${admin.email} (login: admin / admin123)`);

  // 1 Mapel contoh
  const mapel = await prisma.mapel.upsert({
    where: { namaMapel: "Al-Qur'an" },
    update: {},
    create: { namaMapel: "Al-Qur'an" },
  });
  console.log(`✔ Mapel: ${mapel.namaMapel}`);

  // 1 Kelas contoh
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
  console.log(`✔ Kelas: ${kelas.namaKelas} (${kelas.gender})`);

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