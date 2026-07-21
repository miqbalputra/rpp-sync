# Dockerfile untuk deploy Coolify (VPS) — Next.js + MariaDB + Chromium (Puppeteer).
# Build: otomatis oleh Coolify dari repo ini. Start: migrate + seed + next start.
FROM node:20-bookworm-slim

# Chromium + font untuk export PDF/gambar via Puppeteer.
# Pakai chromium sistem (bukan bundle puppeteer) agar image lebih kecil & cepat.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium fonts-noto-color-emoji fonts-dejavu-core ca-certificates tini \
    && rm -rf /var/lib/apt/lists/*

# Pakai chromium sistem; lewati download bundle puppeteer.
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Install deps dulu (layer cache). devDeps dipasang agar `next build` & `tsx` (seed) jalan.
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# Generate Prisma client untuk skema PRODUKSI (mysql). Postinstall sudah generate
# versi sqlite (dev) — perintah ini menimpa dengan client mysql yang dipakai runtime.
RUN npx prisma generate --schema=prisma/prod/schema.prisma

# Salin source & build.
COPY . .
RUN npm run build

# Port aplikasi. Coolify menyuntikkan PORT; fallback 3000.
EXPOSE 3000

# Entrypoint: jalankan migrasi MariaDB, seed (prod-mode), lalu server Next.js.
# NODE_ENV=production hanya di sini agar seed pakai password dari ADMIN_PASSWORD
# dan melewati data contoh (kecuali SEED_DEMO=true).
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sh", "-c", "NODE_ENV=production npx prisma migrate deploy --schema=prisma/prod/schema.prisma && NODE_ENV=production npm run db:seed && npm run start -- -H 0.0.0.0 -p ${PORT:-3000}"]