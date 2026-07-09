# Sử dụng môi trường Node.js bản 20 (nhẹ và ổn định)
FROM node:20-alpine

# Tạo thư mục làm việc bên trong container
WORKDIR /app

# Bật pnpm theo phiên bản đã khai báo trong package.json
RUN corepack enable

# Copy manifest và lockfile vào trước để cài thư viện
COPY package.json pnpm-lock.yaml ./

# Cài đặt thư viện
RUN pnpm install --frozen-lockfile

# Copy toàn bộ code còn lại vào container
COPY . .

# Mở cổng 5000 cho Backend
EXPOSE 5000

# Lệnh khởi chạy server
CMD ["pnpm", "start"]
# package.json chạy entrypoint: node src/server.js
