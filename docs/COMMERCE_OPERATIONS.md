# Vận hành commerce DPWOOD

Tài liệu này là checklist phát hành và vận hành cho catalog, tồn kho, đơn hàng, giao hàng, đổi trả, phân tích và bảo mật.

## Trước khi phát hành

1. Tạo backup bằng `pnpm db:backup`.
2. Chạy `pnpm db:migrate`.
3. Chạy `pnpm test` tại `server`.
4. Chạy `pnpm lint` và `pnpm build` tại `client`.
5. Chạy `pnpm products:quality` và xử lý sản phẩm thiếu SKU, ảnh, giá hoặc tồn kho.
6. Kiểm tra health nhẹ `/api/health` và health sâu `/api/health?deep=true`.

Không chạy `products:normalize` trực tiếp trên production nếu chưa xem báo cáo quality và backup dữ liệu.

## Tồn kho và đơn hàng

- Mỗi thay đổi tồn kho do checkout, hủy hoặc hoàn trả phải có bản ghi trong `InventoryMovements`.
- Checkout khóa sản phẩm trong transaction và dùng `Idempotency-Key` để tránh tạo trùng đơn.
- Đơn QR giữ tồn kho trong thời hạn thanh toán. Đơn hết hạn cần được hủy và hoàn tồn.
- Đối soát số lượng `Products.stock` với sổ tồn kho định kỳ, đặc biệt sau import hoặc chỉnh sửa hàng loạt.

## Giao hàng và đổi trả

- Phí giao hàng được tính ở backend; client chỉ hiển thị kết quả quote.
- Nhân viên cập nhật hãng vận chuyển, mã vận đơn, ETA và trạng thái shipment trong chi tiết đơn.
- Chỉ nhận yêu cầu đổi trả của đơn hoàn tất, trong `returnWindowDays` và khi sản phẩm cho phép trả.
- Tiền hoàn, trạng thái PayOS và trạng thái đổi trả phải được đối soát thủ công trước khi đánh dấu hoàn tất.

## Catalog và Merchant Center

- Ảnh chính nên vuông, rõ sản phẩm, dùng HTTPS và không dùng placeholder.
- SKU phải duy nhất. Điền GTIN/MPN nếu nhà sản xuất cung cấp.
- Điền trọng lượng đóng gói, kích thước kiện, thương hiệu, xuất xứ, SEO title/description và Google Product Category.
- Kiểm tra `merchant-feed.xml`, `sitemap.xml` và trang Product structured data sau mỗi thay đổi schema catalog.
- Xem quy trình kết nối tại [MERCHANT_CENTER.md](MERCHANT_CENTER.md).

## Phân tích và tăng trưởng

- Storefront ghi nhận `page_view`, `view_item`, `add_to_cart`, `begin_checkout` và `purchase`.
- Dashboard quản trị hiển thị funnel, doanh thu đã xác nhận và lợi nhuận gộp ước tính theo `costPrice`.
- Chỉ bật `ENABLE_GROWTH_AUTOMATIONS=true` sau khi Resend domain đã verified và nội dung email đã được duyệt.
- Cart recovery và thông báo giảm giá wishlist phải có giới hạn tần suất, unsubscribe và retention.

## Giám sát

- Uptime monitor gọi `/api/health` mỗi 5 phút; không dùng endpoint sản phẩm hoặc checkout.
- Cảnh báo khi health sâu thất bại, tỷ lệ 5xx tăng hoặc p95 latency tăng liên tục.
- `/api/analytics/metrics` chỉ dành cho quản trị và chứa thống kê ngắn hạn trong bộ nhớ.
- Theo dõi dung lượng `AnalyticsEvents`, logs, sessions và cart recovery; retention service tự xóa dữ liệu hết hạn.

## Bảo mật

- Bật 2FA cho `admin` và `root`.
- Thu hồi phiên lạ trong trang Hồ sơ > Bảo mật.
- Không ghi token, mật khẩu, địa chỉ hoặc nội dung thanh toán vào analytics/log.
- Xoay vòng JWT secret, refresh pepper và API key khi bị lộ.
- Kiểm tra checklist [SECURITY_ASVS_CHECKLIST.md](SECURITY_ASVS_CHECKLIST.md) trước mỗi đợt phát hành lớn.

## Phục hồi sự cố

1. Dừng thao tác ghi hoặc đặt trang vào chế độ bảo trì.
2. Tạo thêm một backup hiện trạng.
3. Xác định migration, import hoặc thao tác quản trị gây lỗi.
4. Khôi phục bằng `pnpm db:restore -- --file=C:\backup\dpwood.json --confirm` trên database thử nghiệm trước.
5. Kiểm tra tổng số sản phẩm, người dùng, đơn, order items và inventory movements.
6. Chỉ khôi phục production sau khi kết quả đối soát đạt yêu cầu.
