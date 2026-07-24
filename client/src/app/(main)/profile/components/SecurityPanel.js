"use client";

import { useCallback, useEffect, useState } from "react";
import { App, Alert, Button, List, Space, Switch, Tag, Typography } from "antd";
import {
    DeleteOutlined,
    DesktopOutlined,
    SafetyCertificateOutlined,
} from "@ant-design/icons";
import api from "@/utils/axios";

const { Text, Title } = Typography;

const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString("vi-VN") : "Không xác định";

export default function SecurityPanel({ user, onRefresh }) {
    const { message, modal } = App.useApp();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [updatingTwoFactor, setUpdatingTwoFactor] = useState(false);

    const canUseTwoFactor = ["root", "admin"].includes(
        String(user?.role || "").toLowerCase(),
    );

    const loadSessions = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/auth/sessions");
            setSessions(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            message.error(
                error.response?.data?.message || "Không thể tải danh sách phiên đăng nhập.",
            );
        } finally {
            setLoading(false);
        }
    }, [message]);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    const updateTwoFactor = async (enabled) => {
        try {
            setUpdatingTwoFactor(true);
            await api.put("/auth/2fa", { enabled });
            message.success(
                enabled
                    ? "Đã bật xác thực hai bước cho tài khoản quản trị."
                    : "Đã tắt xác thực hai bước.",
            );
            await onRefresh?.();
        } catch (error) {
            message.error(
                error.response?.data?.message || "Không thể cập nhật xác thực hai bước.",
            );
        } finally {
            setUpdatingTwoFactor(false);
        }
    };

    const revokeSession = (session) => {
        modal.confirm({
            title: "Thu hồi phiên đăng nhập?",
            content: `Thiết bị này sẽ phải đăng nhập lại. Hoạt động gần nhất: ${formatDateTime(
                session.lastUsedAt,
            )}.`,
            okText: "Thu hồi",
            cancelText: "Giữ lại",
            okButtonProps: { danger: true },
            onOk: async () => {
                await api.delete(`/auth/sessions/${session.id}`);
                message.success("Đã thu hồi phiên đăng nhập.");
                await loadSessions();
            },
        });
    };

    return (
        <div className="dp-security-panel">
            <div className="dp-security-heading">
                <div>
                    <Title level={4}>Xác thực hai bước</Title>
                    <Text type="secondary">
                        Yêu cầu mã xác minh qua email sau khi mật khẩu hoặc tài khoản liên kết
                        được xác thực.
                    </Text>
                </div>
                {canUseTwoFactor ? (
                    <Switch
                        checked={Boolean(user?.twoFactorEnabled)}
                        loading={updatingTwoFactor}
                        onChange={updateTwoFactor}
                        checkedChildren="Bật"
                        unCheckedChildren="Tắt"
                    />
                ) : (
                    <Tag icon={<SafetyCertificateOutlined />}>Dành cho quản trị viên</Tag>
                )}
            </div>

            {!canUseTwoFactor && (
                <Alert
                    type="info"
                    showIcon
                    title="Tài khoản người mua được bảo vệ bằng quản lý phiên và khóa đăng nhập."
                />
            )}

            <div className="dp-security-sessions">
                <Title level={4}>Phiên đăng nhập đang hoạt động</Title>
                <List
                    loading={loading}
                    dataSource={sessions}
                    locale={{ emptyText: "Không có phiên đăng nhập nào đang hoạt động." }}
                    renderItem={(session) => (
                        <List.Item
                            actions={[
                                <Button
                                    key="revoke"
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    aria-label="Thu hồi phiên"
                                    onClick={() => revokeSession(session)}
                                />,
                            ]}
                        >
                            <List.Item.Meta
                                avatar={<DesktopOutlined className="dp-security-device-icon" />}
                                title={session.deviceLabel || "Trình duyệt web"}
                                description={
                                    <Space direction="vertical" size={0}>
                                        <Text type="secondary">
                                            Hoạt động: {formatDateTime(session.lastUsedAt)}
                                        </Text>
                                        <Text type="secondary">
                                            Hết hạn: {formatDateTime(session.expiresAt)}
                                        </Text>
                                    </Space>
                                }
                            />
                        </List.Item>
                    )}
                />
            </div>
        </div>
    );
}
