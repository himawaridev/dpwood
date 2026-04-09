import React from "react";
import { Col, Typography, Flex } from "antd";
import { EnvironmentOutlined, PhoneOutlined, MailOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function FooterContact() {
    return (
        <Col xs={24} sm={24} md={8}>
            <Title level={4} style={{ color: "#fff", marginBottom: 20 }}>
                THÔNG TIN LIÊN HỆ
            </Title>
            <Flex vertical gap="middle">
                <div style={{ display: "flex", gap: "12px" }}>
                    <EnvironmentOutlined
                        style={{
                            fontSize: "16px",
                            marginTop: "4px",
                            color: "rgba(255, 255, 255, 0.65)",
                        }}
                    />
                    <Text style={{ color: "rgba(255, 255, 255, 0.65)" }}>
                        59 Hồ Xuân Hương Phủ Lý Hà Nam
                    </Text>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <PhoneOutlined
                        style={{ fontSize: "16px", color: "rgba(255, 255, 255, 0.65)" }}
                    />
                    <Text style={{ color: "rgba(255, 255, 255, 0.65)" }}>
                        Hotline: <strong style={{ color: "#fff" }}>0522535155</strong>
                    </Text>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <MailOutlined
                        style={{ fontSize: "16px", color: "rgba(255, 255, 255, 0.65)" }}
                    />
                    <Text style={{ color: "rgba(255, 255, 255, 0.65)" }}>
                        Email: itokazukiqygnn@gmail.com
                    </Text>
                </div>
            </Flex>
        </Col>
    );
}
