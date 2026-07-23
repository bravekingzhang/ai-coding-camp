# 统一镜像：web(standalone) + worker(tsx) 共用
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# runner：同时服务 web 和 worker（docker-compose 用 CMD 区分）
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# web standalone 产物（自带精简依赖）
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# worker 需要：完整 node_modules（含 tsx/esbuild 平台二进制）+ 源码 + prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/worker ./worker
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["node", "server.js"]
