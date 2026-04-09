import React from "react";
import { Col, Typography, Flex } from "antd";

const { Title, Link } = Typography;

export default function FooterPolicies() {
    return (
        <Col xs={24} sm={12} md={8}>
            <Title level={4} style={{ color: "#fff", marginBottom: 20 }}>
                HỖ TRỢ KHÁCH HÀNG
            </Title>
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
    );
}
