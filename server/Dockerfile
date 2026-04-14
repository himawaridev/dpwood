# Sử dụng môi trường Node.js bản 20 (Nhẹ và ổn định)
FROM node:20-alpine

# Tạo thư mục làm việc bên trong container
WORKDIR /app

# Copy file package.json vào trước để cài thư viện
COPY package*.json ./

# Cài đặt thư viện
RUN npm install --legacy-peer-deps

# Copy toàn bộ code còn lại vào container
COPY . .

# Mở cổng 5000 cho Backend
EXPOSE 5000

# Lệnh khởi chạy server
CMD ["npm", "start"] 
# (Lưu ý: Đảm bảo trong package.json của server có lệnh "start": "node server.js")