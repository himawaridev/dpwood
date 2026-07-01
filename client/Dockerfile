FROM node:20-alpine

WORKDIR /app

ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=58388469399-v905n25i8ogkh8jdu3gi0qbc1m0tstv9.apps.googleusercontent.com
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID

COPY package*.json ./

# Cài đặt thư viện bằng force để tránh lỗi xung đột peer dependencies nếu có
RUN npm install --legacy-peer-deps

COPY . .

# Build Next.js ra bản Production
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=58388469399-v905n25i8ogkh8jdu3gi0qbc1m0tstv9.apps.googleusercontent.com
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
RUN npm run build

# Mở cổng 3000 cho Frontend
EXPOSE 3000

# Lệnh chạy Next.js
CMD ["npm", "start"]
