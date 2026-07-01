import React from "react";
import { Layout, Row, Col, Typography, Space, Divider } from "antd";
import {
    EnvironmentOutlined,
    FacebookOutlined,
    InstagramOutlined,
    MailOutlined,
    PhoneOutlined,
    YoutubeOutlined,
} from "@ant-design/icons";

const { Footer } = Layout;
const { Title, Text, Link } = Typography;

export default function AppFooter() {
    return (
        <Footer
            style={{
                background: "#10231e",
                color: "rgba(255, 255, 255, 0.72)",
                padding: "46px 20px 22px",
            }}
        >
            <div className="dp-container">
                <Row gutter={[32, 28]}>
                    <Col xs={24} md={9}>
                        <Space orientation="vertical" size={14}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 8,
                                        background: "var(--dp-primary)",
                                        color: "#fff",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 900,
                                    }}
                                >
                                    DP
                                </span>
                                <div>
                                    <Title level={4} style={{ color: "#fff", margin: 0 }}>
                                        DPWOOD
                                    </Title>
                                    <Text style={{ color: "rgba(255,255,255,0.58)" }}>
                                        Nội thất gỗ chọn lọc
                                    </Text>
                                </div>
                            </div>
                            <Text style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.8 }}>
                                DPWOOD mang đến các sản phẩm nội thất gỗ phù hợp không gian sống
                                hiện đại, với quy trình đặt hàng rõ ràng và hỗ trợ sau bán.
                            </Text>
                            <Space size={16}>
                                <Link href="#" style={{ color: "#fff", fontSize: 20 }}>
                                    <FacebookOutlined />
                                </Link>
                                <Link href="#" style={{ color: "#fff", fontSize: 20 }}>
                                    <InstagramOutlined />
                                </Link>
                                <Link href="#" style={{ color: "#fff", fontSize: 20 }}>
                                    <YoutubeOutlined />
                                </Link>
                            </Space>
                        </Space>
                    </Col>

                    <Col xs={24} sm={12} md={7}>
                        <Title level={5} style={{ color: "#fff", marginBottom: 16 }}>
                            Hỗ trợ khách hàng
                        </Title>
                        <Space orientation="vertical" size={10}>
                            {[
                                "Hướng dẫn mua hàng",
                                "Chính sách thanh toán",
                                "Chính sách giao hàng",
                                "Đổi trả & bảo hành",
                                "Bảo mật thông tin",
                            ].map((item) => (
                                <Link key={item} href="#" style={{ color: "rgba(255,255,255,0.72)" }}>
                                    {item}
                                </Link>
                            ))}
                        </Space>
                    </Col>

                    <Col xs={24} sm={12} md={8}>
                        <Title level={5} style={{ color: "#fff", marginBottom: 16 }}>
                            Liên hệ
                        </Title>
                        <Space orientation="vertical" size={14}>
                            <Text style={{ color: "rgba(255,255,255,0.72)" }}>
                                <EnvironmentOutlined /> 59 Hồ Xuân Hương, Phủ Lý, Hà Nam
                            </Text>
                            <Text style={{ color: "rgba(255,255,255,0.72)" }}>
                                <PhoneOutlined /> Hotline: <strong style={{ color: "#fff" }}>0522535155</strong>
                            </Text>
                            <Text style={{ color: "rgba(255,255,255,0.72)" }}>
                                <MailOutlined /> itokazukiqygnn@gmail.com
                            </Text>
                        </Space>
                    </Col>
                </Row>

                <Divider style={{ borderColor: "rgba(255,255,255,0.12)", margin: "30px 0 18px" }} />

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        color: "rgba(255,255,255,0.5)",
                        fontSize: 13,
                    }}
                >
                    <span>DPWOOD ©{new Date().getFullYear()}</span>
                    <span>dpwood.store</span>
                </div>
            </div>
        </Footer>
    );
}
