# Google Merchant Center cho DPWOOD

Hệ thống cung cấp dữ liệu sản phẩm theo các URL production sau:

- Feed sản phẩm: `https://dpwood.store/merchant-feed.xml`
- Sitemap: `https://dpwood.store/sitemap.xml`
- Robots: `https://dpwood.store/robots.txt`

## Chuẩn bị dữ liệu

Trước khi gửi feed, mỗi sản phẩm đang hoạt động cần có:

- Tên, mô tả, giá VND, tồn kho và danh mục chính xác.
- Ảnh sản phẩm HTTPS rõ nét, không dùng ảnh placeholder hoặc URL tạm.
- SKU duy nhất. Điền GTIN của nhà sản xuất nếu có; nếu không có, điền MPN hoặc để hệ thống xuất `identifier_exists=false`.
- Thương hiệu, trạng thái hàng và URL trang chi tiết hợp lệ.
- Chính sách giao hàng, đổi trả khớp với thông tin hiển thị trên website.

Có thể kiểm tra và chuẩn hóa dữ liệu bằng:

```bash
cd server
pnpm products:quality
pnpm products:normalize
```

Lệnh normalize tạo bản sao lưu trước khi cập nhật, gộp biến thể trùng và chỉ vô hiệu hóa sản phẩm lỗi/trùng thay vì xóa cứng.

## Kết nối Merchant Center

1. Tạo hoặc mở tài khoản Google Merchant Center cho DPWOOD.
2. Xác minh và xác nhận quyền sở hữu tên miền `dpwood.store`.
3. Khai báo thông tin doanh nghiệp, Việt Nam, ngôn ngữ tiếng Việt và tiền tệ VND.
4. Trong Data sources, thêm nguồn kiểu Scheduled fetch bằng URL `https://dpwood.store/merchant-feed.xml`.
5. Chọn tải lại hằng ngày để giá và tồn kho được cập nhật.
6. Khai báo chính sách vận chuyển và đổi trả trong Merchant Center giống nội dung trên DPWOOD.
7. Kiểm tra Diagnostics, sửa toàn bộ lỗi ảnh, giá, URL, định danh và chính sách trước khi chạy quảng cáo.

Feed chỉ công bố dữ liệu sản phẩm hiện có trong database. Không đưa API key, token quản trị hoặc dữ liệu khách hàng vào feed.

## Kiểm tra nhanh

```bash
curl -I https://dpwood.store/merchant-feed.xml
curl -I https://dpwood.store/sitemap.xml
curl -I https://dpwood.store/robots.txt
```

Ba URL phải trả HTTP 200. Feed phải có đúng số sản phẩm đang hoạt động; URL ảnh và URL sản phẩm trong feed phải truy cập được công khai qua HTTPS.
