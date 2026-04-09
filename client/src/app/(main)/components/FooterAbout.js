import React from "react";
import { Col, Typography, Flex } from "antd";
import { FacebookOutlined, InstagramOutlined, YoutubeOutlined } from "@ant-design/icons";

const { Title, Text, Link } = Typography;

export default function FooterAbout() {
    return (
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
                DPWOOD là thương hiệu nội thất gỗ cao cấp, mang đến các giải pháp không gian sống
                hiện đại, tinh tế và bền vững. Chúng tôi cam kết chất lượng trên từng sản phẩm.
            </Text>
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
    );
}
