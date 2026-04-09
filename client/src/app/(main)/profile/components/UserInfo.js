import React from "react";
import { Row, Col, Avatar, Button, Typography, Space, Tag, Divider, Descriptions } from "antd";
import {
    UserOutlined,
    SettingOutlined,
    MailOutlined,
    IdcardOutlined,
    CalendarOutlined,
    SafetyCertificateOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

export default function UserInfo({ user, onOpenEdit }) {
    const renderRoleTag = (role) => {
        const r = role?.toLowerCase();
        switch (r) {
            case "root":
                return (
                    <Tag
                        color="red"
                        icon={<SafetyCertificateOutlined />}
                        style={{ fontWeight: "bold" }}
                    >
                        ROOT
                    </Tag>
                );
            case "admin":
                return (
                    <Tag color="gold" icon={<IdcardOutlined />} style={{ fontWeight: "bold" }}>
                        ADMIN
                    </Tag>
                );
            case "seller":
                return (
                    <Tag color="green" icon={<UserOutlined />} style={{ fontWeight: "bold" }}>
                        SELLER
                    </Tag>
                );
            default:
                return (
                    <Tag color="blue" icon={<UserOutlined />} style={{ fontWeight: "bold" }}>
                        USER
                    </Tag>
                );
        }
    };

    const profileDescriptions = [
        {
            key: "1",
            label: (
                <span>
                    <MailOutlined /> Email
                </span>
            ),
            children: <div style={{ whiteSpace: "nowrap" }}>{user?.email}</div>,
        },
        {
            key: "2",
            label: (
                <span>
                    <IdcardOutlined /> Quyền hạn
                </span>
            ),
            children: renderRoleTag(user?.role),
        },
        {
            key: "3",
            label: (
                <span>
                    <CalendarOutlined /> Ngày gia nhập
                </span>
            ),
            children: user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                : "N/A",
        },
    ];

    return (
        <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={6} lg={4} style={{ textAlign: "center" }}>
                <Avatar
                    size={120}
                    icon={!user?.avatarUrl ? <UserOutlined /> : null}
                    {...(user?.avatarUrl ? { src: user.avatarUrl } : {})}
                    style={{ border: "4px solid #e6f7ff", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                />
            </Col>
            <Col xs={24} md={18} lg={20}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                    }}
                >
                    <div>
                        <Title level={2} style={{ margin: 0 }}>
                            {user?.name}
                        </Title>
                        <Space style={{ marginTop: 8 }}>
                            {renderRoleTag(user?.role)}
                            <Tag color="green" icon={<SafetyCertificateOutlined />}>
                                Tài khoản tin cậy
                            </Tag>
                        </Space>
                    </div>
                    <Button
                        type="primary"
                        size="large"
                        icon={<SettingOutlined style={{ fontSize: "20px" }} />}
                        onClick={onOpenEdit}
                        title="Thiết lập tài khoản"
                        style={{
                            borderRadius: "8px",
                            width: "40px",
                            height: "40px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            boxShadow: "0 2px 8px rgba(24, 144, 255, 0.2)",
                        }}
                    />
                </div>
                <Divider style={{ margin: "16px 0" }} />
                <Descriptions column={{ xs: 1, sm: 2, md: 3 }} items={profileDescriptions} />
            </Col>
        </Row>
    );
}
