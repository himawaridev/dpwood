import React from "react";
import { Row, Col, Avatar, Button, Typography, Space, Tag, Divider, Descriptions, Card, Flex } from "antd";
import {
    UserOutlined,
    SettingOutlined,
    MailOutlined,
    IdcardOutlined,
    CalendarOutlined,
    SafetyCertificateOutlined,
    CheckCircleFilled,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function UserInfo({ user, onOpenEdit }) {
    const renderRoleTag = (role) => {
        const r = role?.toLowerCase();
        switch (r) {
            case "root":
                return <Tag color="red" icon={<SafetyCertificateOutlined />} style={{ fontWeight: "600", padding: "2px 10px", borderRadius: 12 }}>ROOT</Tag>;
            case "admin":
                return <Tag color="gold" icon={<IdcardOutlined />} style={{ fontWeight: "600", padding: "2px 10px", borderRadius: 12 }}>ADMIN</Tag>;
            case "seller":
                return <Tag color="green" icon={<UserOutlined />} style={{ fontWeight: "600", padding: "2px 10px", borderRadius: 12 }}>SELLER</Tag>;
            default:
                return <Tag color="blue" icon={<UserOutlined />} style={{ fontWeight: "600", padding: "2px 10px", borderRadius: 12 }}>USER</Tag>;
        }
    };

    const profileDescriptions = [
        {
            key: "1",
            label: <span style={{ color: "#8c8c8c", fontWeight: 500 }}><MailOutlined style={{ marginRight: 6 }}/>Email</span>,
            children: <Text strong>{user?.email}</Text>,
        },
        {
            key: "2",
            label: <span style={{ color: "#8c8c8c", fontWeight: 500 }}><IdcardOutlined style={{ marginRight: 6 }}/>Quyền hạn</span>,
            children: renderRoleTag(user?.role),
        },
        {
            key: "3",
            label: <span style={{ color: "#8c8c8c", fontWeight: 500 }}><CalendarOutlined style={{ marginRight: 6 }}/>Ngày tham gia</span>,
            children: <Text strong>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "N/A"}</Text>,
        },
    ];

    return (
        <div style={{ borderRadius: 16, background: "#fff", border: "1px solid #f0f0f0", padding: "24px 32px" }}>
            <Flex align="flex-end" justify="space-between" wrap="wrap" gap="large">
                <Flex align="flex-end" gap={24} wrap="wrap" style={{ flex: 1 }}>
                    <Avatar
                        size={130}
                        icon={!user?.avatarUrl ? <UserOutlined /> : null}
                        {...(user?.avatarUrl ? { src: user.avatarUrl } : {})}
                        style={{
                            border: "1px solid #d9d9d9",
                            backgroundColor: "#f0f2f5"
                        }}
                    />
                        <div style={{ paddingBottom: 12 }}>
                            <Title level={2} style={{ margin: 0, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                                {user?.name}
                                <CheckCircleFilled style={{ color: "#1677ff", fontSize: 20 }} title="Đã xác minh" />
                            </Title>
                            <Space style={{ marginTop: 12 }} size="middle" wrap>
                                {renderRoleTag(user?.role)}
                                <Tag color="success" style={{ padding: "2px 10px", borderRadius: 12, fontWeight: 500, border: "none", background: "#f6ffed" }}>
                                    <SafetyCertificateOutlined style={{ marginRight: 4 }}/> Tài khoản an toàn
                                </Tag>
                            </Space>
                        </div>
                    </Flex>
                    
                    <Button
                        type="primary"
                        size="large"
                        icon={<SettingOutlined />}
                        onClick={onOpenEdit}
                        style={{
                            borderRadius: 12,
                            fontWeight: 600,
                            boxShadow: "0 4px 12px rgba(22, 119, 255, 0.3)",
                            marginBottom: 12
                        }}
                    >
                        Chỉnh sửa hồ sơ
                    </Button>
                </Flex>

                <Divider style={{ margin: "24px 0", borderColor: "#f0f0f0" }} />
                
                <Card bordered={false} style={{ background: "#f8fafd", borderRadius: 12 }}>
                    <Descriptions 
                        column={{ xs: 1, sm: 1, md: 3 }} 
                        items={profileDescriptions}
                        size="middle"
                    />
                </Card>
        </div>
    );
}
