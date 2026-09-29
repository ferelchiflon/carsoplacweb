# ============================================
# BACKEND CARSPLAC - PRODUCCIÓN
# ============================================

# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci && npm cache clean --force

# Copiar código
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Construir
RUN npm run build

# ============================================
# Etapa 2: Producción
# ============================================

FROM node:20-alpine

WORKDIR /app

# Instalar curl para healthcheck
RUN apk add --no-cache curl

# Crear usuario no root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar dependencias de producción
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copiar código compilado
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copiar Prisma
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Copiar package.json
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Cambiar a usuario no root
USER nodejs

# Puerto
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Comando de inicio
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma generate && node dist/main"]