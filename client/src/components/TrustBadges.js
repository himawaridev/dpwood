"use client";
import { Typography, Row, Col, Flex } from "antd";
import {
    TruckOutlined,
    SafetyCertificateOutlined,
    CustomerServiceOutlined,
    AppstoreOutlined
} from "@ant-design/icons";

const { Text } = Typography;

export default function TrustBadges({ isMobile }) {
    const badges = [
        {
            icon: <TruckOutlined style={{ fontSize: 28, color: "#1677ff" }} />,
            title: "Giao hàng toàn quốc",
            desc: "Miễn phí vận chuyển cho đơn từ 500K",
        },
        {
            icon: <SafetyCertificateOutlined style={{ fontSize: 28, color: "#52c41a" }} />,
            title: "Cam kết chất lượng",
            desc: "Gỗ nhập khẩu chính hãng 100%",
        },
        {
            icon: <CustomerServiceOutlined style={{ fontSize: 28, color: "#fa8c16" }} />,
            title: "Hỗ trợ 24/7",
            desc: "Tư vấn miễn phí mọi lúc",
        },
        {
            icon: <AppstoreOutlined style={{ fontSize: 28, color: "#722ed1" }} />,
            title: "Đa dạng mẫu mã",
            desc: "Hơn 500+ sản phẩm gỗ cao cấp",
        },
    ];

    return (
        <div
            style={{
                width: "100vw",
                marginLeft: "calc(-50vw + 50%)",
                background: "#fff",
                borderTop: "1px solid #f0f0f0",
                borderBottom: "1px solid #f0f0f0",
            }}
        >
            <div
                style={{
                    maxWidth: 1200,
                    margin: "0 auto",
                    padding: isMobile ? "24px 16px" : "36px 24px",
                }}
            >
                <Row gutter={[16, 16]}>
                    {badges.map((badge, idx) => (
                        <Col xs={12} sm={12} md={6} key={idx}>
                            <Flex
                                align="center"
                                gap={isMobile ? 10 : 14}
                                style={{
                                    padding: isMobile ? "8px 0" : "12px 0",
                                }}
                            >
                                <div
                                    style={{
                                        width: isMobile ? 44 : 56,
                                        height: isMobile ? 44 : 56,
                                        borderRadius: 14,
                                        background: "#f5f5f5",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    {badge.icon}
                                </div>
                                <div>
                                    <Text
                                        strong
                                        style={{
                                            fontSize: isMobile ? 13 : 14,
                                            display: "block",
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {badge.title}
                                    </Text>
                                    {!isMobile && (
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                color: "#8c8c8c",
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            {badge.desc}
                                        </Text>
                                    )}
                                </div>
                            </Flex>
                        </Col>
                    ))}
                </Row>
            </div>
        </div>
    );
}