FROM node:20-alpine

WORKDIR /app

ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=58388469399-v905n25i8ogkh8jdu3gi0qbc1m0tstv9.apps.googleusercontent.com
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=dpwood_store_bot
ENV NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=$NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

# Build Next.js ra bản Production
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=58388469399-v905n25i8ogkh8jdu3gi0qbc1m0tstv9.apps.googleusercontent.com
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
RUN pnpm build

# Mở cổng 3000 cho Frontend
EXPOSE 3000

# Lệnh chạy Next.js
CMD ["pnpm", "start"]
