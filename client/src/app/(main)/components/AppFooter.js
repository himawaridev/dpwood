import React from "react";
import NextLink from "next/link";
import { Button, Col, Input, Layout, Row, Space, Typography } from "antd";
import { EnvironmentOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";

const { Footer } = Layout;
const { Title, Text, Link } = Typography;

const footerGroups = [
    {
        title: "Sản phẩm & hỗ trợ",
        links: [
            { label: "Liên hệ hỗ trợ", href: "/support" },
            { label: "Tất cả sản phẩm", href: "/products" },
            { label: "Mã giảm giá", href: "/gift-codes" },
            { label: "Cẩm nang nhà bếp", href: "/blogs" },
            { label: "Theo dõi đơn hàng", href: "/profile" },
        ],
    },
    {
        title: "Điều khoản & chính sách",
        links: [
            { label: "Điều khoản sử dụng", href: "/policies/terms-of-service" },
            { label: "Chính sách bảo mật", href: "/policies/privacy-policy" },
            { label: "Chính sách giao hàng", href: "/policies/shipping-policy" },
            { label: "Đổi trả & hoàn tiền", href: "/policies/returns-refunds" },
            { label: "Chính sách thanh toán", href: "/policies/payment-policy" },
        ],
    },
    {
        title: "DPWOOD",
        links: [
            { label: "Về DPWOOD", href: "/about" },
            { label: "Cửa hàng", href: "/products" },
            { label: "Bài viết mới", href: "/blogs" },
            { label: "Trung tâm hỗ trợ", href: "/support" },
        ],
    },
];

export default function AppFooter() {
    return (
        <Footer className="webcake-footer">
            <div className="webcake-container">
                <div className="webcake-newsletter">
                    <Title level={3}>Đăng ký nhận bản tin</Title>
                    <Space.Compact className="webcake-newsletter-form">
                        <Input placeholder="Nhập địa chỉ email" />
                        <Button type="primary">ĐĂNG KÝ</Button>
                    </Space.Compact>
                </div>

                <Row gutter={[34, 30]}>
                    <Col xs={24} lg={7}>
                        <Title level={5}>Thông tin cửa hàng</Title>
                        <Space orientation="vertical" size={12}>
                            <Text>
                                <EnvironmentOutlined /> 128 Hàng Trống, Hoàn Kiếm, Hà Nội
                            </Text>
                            <Link href="mailto:itokazukiqygnn@gmail.com">
                                <MailOutlined /> itokazukiqygnn@gmail.com
                            </Link>
                            <Link href="tel:0522535155">
                                <PhoneOutlined /> 0522535155
                            </Link>
                        </Space>
                    </Col>

                    {footerGroups.map((group) => (
                        <Col xs={24} sm={8} lg={5} key={group.title}>
                            <Title level={5} className="webcake-footer-group-title">
                                {group.title}
                            </Title>
                            <Space orientation="vertical" size={10}>
                                {group.links.map((item) => (
                                    <NextLink href={item.href} key={item.href}>
                                        {item.label}
                                    </NextLink>
                                ))}
                            </Space>
                        </Col>
                    ))}
                </Row>

                <div className="webcake-footer-bottom">
                    <span>Bản quyền thuộc về DPWOOD</span>
                    <span>dpwood.store</span>
                </div>
            </div>
        </Footer>
    );
}
