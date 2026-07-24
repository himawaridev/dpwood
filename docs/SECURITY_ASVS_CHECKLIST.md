# Checklist bảo mật DPWOOD

Checklist rút gọn theo OWASP ASVS, dùng cho mỗi lần phát hành production.

## Xác thực và phiên

- [x] Mật khẩu được băm bằng bcrypt, không lưu hoặc ghi log bản rõ.
- [x] Access token ngắn hạn và refresh token được băm trong bảng phiên.
- [x] Có thể thu hồi từng phiên đăng nhập trong hồ sơ.
- [x] Tài khoản quản trị hỗ trợ xác thực hai bước qua mã email 5 phút.
- [x] Đăng nhập, đăng ký và làm mới token có rate limit.
- [ ] Chuyển 2FA quản trị sang TOTP/WebAuthn khi hệ thống có ứng dụng xác thực.

## Phân quyền

- [x] API quản trị kiểm tra role ở backend.
- [x] Người dùng chỉ đọc đơn hàng, vận đơn, đổi trả và giỏ đã lưu của chính mình.
- [x] Staff chỉ truy cập nghiệp vụ vận hành được chỉ định.
- [ ] Chạy kiểm thử ma trận quyền cho toàn bộ route trước mỗi release lớn.

## Dữ liệu và đầu vào

- [x] Sequelize dùng bind parameter; payload sản phẩm được chuẩn hóa và giới hạn độ dài.
- [x] Analytics loại bỏ email, số điện thoại, địa chỉ, token và mật khẩu.
- [x] Upload có giới hạn loại file; URL ảnh được chuẩn hóa.
- [x] Khóa idempotency chống tạo trùng đơn hàng.
- [x] Checkout dùng transaction và khóa dòng tồn kho.
- [ ] Bật mã hóa backup và chính sách xóa backup cũ tại nhà cung cấp lưu trữ.

## HTTP và bí mật

- [x] Helmet/security headers, CORS allowlist và rate limit được bật.
- [x] Production dùng HTTPS; bí mật chỉ nằm trong Render/Vercel environment.
- [x] Không đưa API key, token hay mật khẩu vào Git.
- [ ] Luân phiên khóa JWT, Resend, PayOS, Gemini và Google mỗi 90-180 ngày.
- [ ] Kết nối webhook PayOS production phải được kiểm tra chữ ký và cảnh báo thất bại.

## Vận hành

- [x] Có endpoint health/readiness và metrics quản trị.
- [x] Có migration có lịch sử, script backup và restore có xác nhận.
- [x] Có CI cho test backend, lint và build frontend.
- [ ] Kết nối uptime monitor bên ngoài và gửi cảnh báo 5xx/p95 qua email hoặc Telegram.
- [ ] Chạy dependency audit, DAST (OWASP ZAP) và diễn tập restore hàng quý.

