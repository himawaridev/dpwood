import React from "react";
import { Avatar, Button, Typography, Tag } from "antd";
import {
    UserOutlined,
    SettingOutlined,
    IdcardOutlined,
    CalendarOutlined,
    SafetyCertificateOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

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
            case "staff":
                return (
                    <Tag color="green" icon={<UserOutlined />}>
                        STAFF VẬN HÀNH
                    </Tag>
                );
            default:
                return (
                    <Tag color="#f09b90" icon={<UserOutlined />}>
                        USER
                    </Tag>
                );
        }
    };

    return (
        <div className="dp-profile-user">
            <div className="dp-profile-avatar-wrap">
                <Avatar
                    size={124}
                    icon={!user?.avatarUrl ? <UserOutlined /> : null}
                    {...(user?.avatarUrl ? { src: user.avatarUrl } : {})}
                    className="dp-profile-avatar"
                />
            </div>

            <div className="dp-profile-user-content">
                <div className="dp-profile-user-top">
                    <div className="dp-profile-user-title">
                        <Title level={2}>{user?.name || "Tài khoản DPWOOD"}</Title>
                        <Text className="dp-muted">Cảm ơn bạn đã đồng hành cùng DPWOOD.</Text>
                        <div className="dp-profile-tags">
                            {renderRoleTag(user?.role)}
                            <Tag color="success" icon={<SafetyCertificateOutlined />}>
                                Tài khoản tin cậy
                            </Tag>
                            <Tag icon={<CalendarOutlined />}>
                                Ngày tham gia:{" "}
                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                            </Tag>
                        </div>
                    </div>

                    <Button type="primary" size="large" icon={<SettingOutlined />} onClick={onOpenEdit}>
                        Cập nhật
                    </Button>
                </div>
            </div>
        </div>
    );
}
