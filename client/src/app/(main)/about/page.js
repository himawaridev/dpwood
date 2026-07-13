import Link from "next/link";

export const metadata = {
    title: "Về DPWOOD",
    description: "Thông tin về cửa hàng đồ gỗ và gia dụng nhà bếp DPWOOD.",
};

export default function AboutPage() {
    return (
        <main className="dp-page dp-about-page">
            <div className="dp-container">
                <header className="dp-about-header">
                    <span className="dp-eyebrow">VỀ CỬA HÀNG</span>
                    <h1>DPWOOD</h1>
                    <p>
                        DPWOOD là website bán đồ gỗ và gia dụng nhà bếp, tập trung vào thông tin sản phẩm rõ ràng,
                        lựa chọn biến thể thuận tiện và quy trình mua hàng có thể theo dõi.
                    </p>
                </header>

                <div className="dp-about-grid">
                    <section>
                        <h2>Website cung cấp</h2>
                        <ul>
                            <li>Danh mục nồi chảo, đồ bàn ăn, dụng cụ bếp, lưu trữ và thiết bị gia dụng.</li>
                            <li>Thông tin chất liệu, màu sắc, kích thước, tồn kho và giá theo biến thể.</li>
                            <li>Giỏ hàng, kho mã giảm giá, thanh toán COD hoặc PayOS và lịch sử đơn hàng.</li>
                            <li>Đánh giá sản phẩm, bài viết hướng dẫn và Trung tâm hỗ trợ theo ticket.</li>
                        </ul>
                    </section>
                    <section>
                        <h2>Nguyên tắc vận hành</h2>
                        <ul>
                            <li>Không công bố thông tin sản phẩm hoặc chính sách không có căn cứ.</li>
                            <li>Giá, ưu đãi và tổng thanh toán được xác nhận trước khi tạo đơn.</li>
                            <li>Yêu cầu liên quan đến tiền và dữ liệu cá nhân được chuyển cho quản trị viên.</li>
                            <li>Dữ liệu khách hàng chỉ được sử dụng trong phạm vi cung cấp và bảo vệ dịch vụ.</li>
                        </ul>
                    </section>
                </div>

                <section className="dp-about-contact">
                    <div>
                        <span>Địa chỉ</span>
                        <strong>128 Hàng Trống, Hoàn Kiếm, Hà Nội</strong>
                    </div>
                    <div>
                        <span>Email</span>
                        <a href="mailto:itokazukiqygnn@gmail.com">itokazukiqygnn@gmail.com</a>
                    </div>
                    <div>
                        <span>Điện thoại</span>
                        <a href="tel:0522535155">0522535155</a>
                    </div>
                </section>

                <div className="dp-about-actions">
                    <Link href="/products">Xem sản phẩm</Link>
                    <Link href="/support">Liên hệ hỗ trợ</Link>
                </div>
            </div>
        </main>
    );
}
