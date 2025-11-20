# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

COPY . .

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci --only=production && npm cache clean --force

# Generate Prisma client in production
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

RUN mkdir -p logs

EXPOSE 3000

USER node

CMD ["node", "dist/index.js"]
