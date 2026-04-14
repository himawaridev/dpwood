FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Cài đặt thư viện bằng force để tránh lỗi xung đột peer dependencies nếu có
RUN npm install --legacy-peer-deps

COPY . .

# Build Next.js ra bản Production
RUN npm run build

# Mở cổng 3000 cho Frontend
EXPOSE 3000

# Lệnh chạy Next.js
CMD ["npm", "start"]