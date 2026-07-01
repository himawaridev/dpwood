import React from "react";
import { Table, Tag, Typography, Empty, Alert } from "antd";

const { Text } = Typography;

export default function TransactionHistory({ logs, hasError }) {
    const getActionTag = (action) => {
        const normalizedAction = action?.toUpperCase();
        switch (normalizedAction) {
            case "LOGIN":
                return <Tag color="green">Đăng nhập</Tag>;
            case "LOGOUT":
                return <Tag color="volcano">Đăng xuất</Tag>;
            case "ORDER_CREATED":
                return <Tag color="blue">Tạo đơn hàng</Tag>;
            case "PAYMENT_RECEIVED":
                return <Tag color="cyan">Thanh toán</Tag>;
            case "ORDER_CANCELED":
                return <Tag color="magenta">Hủy đơn</Tag>;
            case "ADMIN_UPDATE_ORDER":
                return <Tag color="purple">QTV cập nhật</Tag>;
            case "SYSTEM":
                return <Tag color="purple">Hệ thống</Tag>;
            default:
                return <Tag>{normalizedAction || "N/A"}</Tag>;
        }
    };

    const columns = [
        {
            title: "Thời gian",
            dataIndex: "createdAt",
            width: 160,
            render: (value) => {
                const date = new Date(value);
                return (
                    <div className="dp-profile-date-cell">
                        <Text strong>{date.toLocaleDateString("vi-VN")}</Text>
                        <Text type="secondary">{date.toLocaleTimeString("vi-VN")}</Text>
                    </div>
                );
            },
        },
        { title: "Hành động", dataIndex: "action", width: 160, render: (action) => getActionTag(action) },
        {
            title: "Mã đơn",
            width: 120,
            render: (_, record) => {
                const match = record.details?.match(/#(\d{6})/);
                return match ? <Text code>#{match[1]}</Text> : <Text type="secondary">-</Text>;
            },
        },
        {
            title: "Ghi chú",
            dataIndex: "details",
            render: (details) => <Text>{details || "-"}</Text>,
        },
    ];

    if (hasError) {
        return (
            <Alert
                type="warning"
                showIcon
                title="Chưa tải được lịch sử hoạt động"
                description="Phần này không ảnh hưởng tới thông tin tài khoản và đơn hàng."
            />
        );
    }

    return (
        <Table
            className="dp-profile-table"
            dataSource={logs}
            rowKey="id"
            pagination={{ pageSize: 5, showSizeChanger: false }}
            scroll={{ x: "max-content" }}
            columns={columns}
            locale={{
                emptyText: <Empty description="Chưa có hoạt động nào" />,
            }}
        />
    );
}
