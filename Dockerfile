# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
# Provide a dummy DATABASE_URL just so `prisma generate` (via postinstall) works at build time.
ENV DATABASE_URL="file:./build.db"
RUN npx prisma generate
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
# Jalankan migrasi lalu start server saat container boot (bukan saat build),
# karena DATABASE_URL production baru tersedia di runtime (Fly secrets).
CMD npx prisma migrate deploy && node server.js
