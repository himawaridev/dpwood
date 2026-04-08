"use client";
import Navbar from "@/components/Navbar";
import { Layout, Row, Col, Typography, Divider, FloatButton, Flex } from "antd";
import {
    EnvironmentOutlined,
    PhoneOutlined,
    MailOutlined,
    FacebookOutlined,
    InstagramOutlined,
    YoutubeOutlined,
} from "@ant-design/icons";

const { Content, Footer } = Layout;
const { Title, Text, Link } = Typography;

export default function MainLayout({ children }) {
    return (
        <Layout style={{ minHeight: "100vh" }}>
            {/* Thanh điều hướng */}
            <Navbar />

            {/* Nội dung chính của trang web */}
            <Content style={{ background: "#f0f2f5", padding: "24px 50px" }}>{children}</Content>

            {/* Footer */}
            <Footer
                style={{
                    background: "#001529",
                    color: "rgba(255, 255, 255, 0.65)",
                    padding: "60px 50px 24px",
                }}
            >
                <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                    <Row gutter={[48, 32]}>
                        {/* CỘT 1: GIỚI THIỆU */}
                        <Col xs={24} sm={12} md={8}>
                            <Title level={4} style={{ color: "#fff", marginBottom: 20 }}>
                                VỀ DPWOOD
                            </Title>
                            <Text
                                style={{
                                    color: "rgba(255, 255, 255, 0.65)",
                                    lineHeight: "1.8",
                                    display: "block",
                                    marginBottom: 16,
                                }}
                            >
                                DPWOOD là thương hiệu nội thất gỗ cao cấp, mang đến các giải pháp
                                không gian sống hiện đại, tinh tế và bền vững. Chúng tôi cam kết
                                chất lượng trên từng sản phẩm.
                            </Text>
                            {/* 🔴 Thay thế Space bằng Flex ngang */}
                            <Flex gap="middle">
                                <Link href="#" style={{ color: "#fff", fontSize: "20px" }}>
                                    <FacebookOutlined />
                                </Link>
                                <Link href="#" style={{ color: "#fff", fontSize: "20px" }}>
                                    <InstagramOutlined />
                                </Link>
                                <Link href="#" style={{ color: "#fff", fontSize: "20px" }}>
                                    <YoutubeOutlined />
                                </Link>
                            </Flex>
                        </Col>

                        {/* CỘT 2: CHÍNH SÁCH */}
                        <Col xs={24} sm={12} md={8}>
                            <Title level={4} style={{ color: "#fff", marginBottom: 20 }}>
                                HỖ TRỢ KHÁCH HÀNG
                            </Title>
                            {/* 🔴 Thay thế Space dọc bằng Flex dọc để dọn dẹp lỗi */}
                            <Flex vertical gap="middle">
                                <Link href="#" style={{ color: "rgba(255, 255, 255, 0.65)" }}>
                                    Hướng dẫn mua hàng
                                </Link>
                                <Link href="#" style={{ color: "rgba(255, 255, 255, 0.65)" }}>
                                    Chính sách thanh toán
                                </Link>
                                <Link href="#" style={{ color: "rgba(255, 255, 255, 0.65)" }}>
                                    Chính sách giao hàng
                                </Link>
                                <Link href="#" style={{ color: "rgba(255, 255, 255, 0.65)" }}>
                                    Chính sách đổi trả & bảo hành
                                </Link>
                                <Link href="#" style={{ color: "rgba(255, 255, 255, 0.65)" }}>
                                    Bảo mật thông tin
                                </Link>
                            </Flex>
                        </Col>

                        {/* CỘT 3: LIÊN HỆ */}
                        <Col xs={24} sm={24} md={8}>
                            <Title level={4} style={{ color: "#fff", marginBottom: 20 }}>
                                THÔNG TIN LIÊN HỆ
                            </Title>
                            {/* 🔴 Thay thế Space dọc bằng Flex dọc */}
                            <Flex vertical gap="middle">
                                <div style={{ display: "flex", gap: "12px" }}>
                                    <EnvironmentOutlined
                                        style={{ fontSize: "16px", marginTop: "4px" }}
                                    />
                                    <Text style={{ color: "rgba(255, 255, 255, 0.65)" }}>
                                        Tầng 8, Tòa nhà X, Số Y, Đường Z, Phường A, Quận B, TP. Hà
                                        Nội
                                    </Text>
                                </div>
                                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                    <PhoneOutlined style={{ fontSize: "16px" }} />
                                    <Text style={{ color: "rgba(255, 255, 255, 0.65)" }}>
                                        Hotline:{" "}
                                        <strong style={{ color: "#fff" }}>0123 456 789</strong>
                                    </Text>
                                </div>
                                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                    <MailOutlined style={{ fontSize: "16px" }} />
                                    <Text style={{ color: "rgba(255, 255, 255, 0.65)" }}>
                                        Email: support@dpwood.vn
                                    </Text>
                                </div>
                            </Flex>
                        </Col>
                    </Row>
                </div>

                <Divider style={{ borderColor: "rgba(255,255,255,0.1)", margin: "32px 0 24px" }} />

                <div style={{ textAlign: "center", color: "rgba(255, 255, 255, 0.45)" }}>
                    DPWOOD ©{new Date().getFullYear()} - Hệ thống quản lý và cung cấp giải pháp nội
                    thất.
                </div>
            </Footer>

            {/* 🔴 NÚT BACK TO TOP LÀM MỚI */}
            <FloatButton.BackTop
                duration={400}
                visibilityHeight={100} // Giảm xuống 100: Chỉ cần cuộn trang một chút là nút sẽ hiện ra ngay
                style={{ right: 30, bottom: 40 }} // Cố định tọa độ để không bị lẹm viền màn hình
                tooltip="Lên đầu trang"
            />
        </Layout>
    );
}
