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
        const normalizedRole = role?.toLowerCase();
        switch (normalizedRole) {
            case "root":
                return (
                    <Tag color="red" icon={<SafetyCertificateOutlined />}>
                        ROOT
                    </Tag>
                );
            case "admin":
                return (
                    <Tag color="gold" icon={<IdcardOutlined />}>
                        ADMIN
                    </Tag>
                );
            case "seller":
                return (
                    <Tag color="green" icon={<UserOutlined />}>
                        SELLER
                    </Tag>
                );
            default:
                return (
                    <Tag color="blue" icon={<UserOutlined />}>
                        USER
                    </Tag>
                );
        }
    };

    const profileDescriptions = [
        {
            key: "email",
            label: (
                <span>
                    <MailOutlined /> Email
                </span>
            ),
            children: <div style={{ whiteSpace: "nowrap" }}>{user?.email || "Chưa cập nhật"}</div>,
        },
        {
            key: "role",
            label: (
                <span>
                    <IdcardOutlined /> Quyền hạn
                </span>
            ),
            children: renderRoleTag(user?.role),
        },
        {
            key: "createdAt",
            label: (
                <span>
                    <CalendarOutlined /> Ngày gia nhập
                </span>
            ),
            children: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "N/A",
        },
    ];

    return (
        <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={5} style={{ textAlign: "center" }}>
                <Avatar
                    size={118}
                    icon={!user?.avatarUrl ? <UserOutlined /> : null}
                    {...(user?.avatarUrl ? { src: user.avatarUrl } : {})}
                    style={{
                        border: "4px solid #eaf7f4",
                        boxShadow: "0 10px 24px rgba(15, 118, 110, 0.14)",
                    }}
                />
            </Col>
            <Col xs={24} md={19}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 16,
                        flexWrap: "wrap",
                    }}
                >
                    <div>
                        <Title level={2} style={{ margin: 0 }}>
                            {user?.name || "Tài khoản DPWOOD"}
                        </Title>
                        <Space style={{ marginTop: 10 }} wrap>
                            {renderRoleTag(user?.role)}
                            <Tag color="success" icon={<SafetyCertificateOutlined />}>
                                Tài khoản tin cậy
                            </Tag>
                        </Space>
                    </div>
                    <Button
                        type="primary"
                        size="large"
                        icon={<SettingOutlined />}
                        onClick={onOpenEdit}
                    >
                        Cập nhật
                    </Button>
                </div>
                <Divider style={{ margin: "18px 0" }} />
                <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} items={profileDescriptions} />
            </Col>
        </Row>
    );
}
