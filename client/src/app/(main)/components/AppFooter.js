import React from "react";
import { Button, Col, Input, Layout, Row, Space, Typography } from "antd";
import { EnvironmentOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";

const { Footer } = Layout;
const { Title, Text, Link } = Typography;

const footerLinks = {
    Products: ["Contact Us", "Shipping", "Sitemap", "FAQs", "Stores"],
    "Quick Links": ["Delivery Information", "About Us", "Privacy Policy", "Terms and Conditions", "Search"],
    "Our Company": ["Terms Conditions", "Policy for Sellers", "Policy for Buyers", "Shipping & Refund"],
};

export default function AppFooter() {
    return (
        <Footer className="webcake-footer">
            <div className="webcake-container">
                <div className="webcake-newsletter">
                    <Title level={3}>Subscribe Our Newsletter</Title>
                    <Space.Compact className="webcake-newsletter-form">
                        <Input placeholder="Enter your email" />
                        <Button type="primary">SUBCRIBE</Button>
                    </Space.Compact>
                </div>

                <Row gutter={[34, 30]}>
                    <Col xs={24} lg={7}>
                        <Title level={5}>Store information</Title>
                        <Space orientation="vertical" size={12}>
                            <Text>
                                <EnvironmentOutlined /> 59 Ho Xuan Huong, Phu Ly, Ha Nam
                            </Text>
                            <Text>
                                <MailOutlined /> itokazukiqygnn@gmail.com
                            </Text>
                            <Text>
                                <PhoneOutlined /> 0522535155
                            </Text>
                        </Space>
                    </Col>

                    {Object.entries(footerLinks).map(([title, links]) => (
                        <Col xs={24} sm={8} lg={5} key={title}>
                            <Title level={5}>{title}</Title>
                            <Space orientation="vertical" size={10}>
                                {links.map((item) => (
                                    <Link href="#" key={item}>
                                        {item}
                                    </Link>
                                ))}
                            </Space>
                        </Col>
                    ))}
                </Row>

                <div className="webcake-footer-bottom">
                    <span>Copyright by DPWOOD | Inspired by Pancake Vietnam</span>
                    <span>dpwood.store</span>
                </div>
            </div>
        </Footer>
    );
}
