import React from "react";
import { Table, Tag, Typography } from "antd";

const { Text } = Typography;

export default function TransactionHistory({ logs }) {
    const getActionTag = (action) => {
        const a = action?.toUpperCase();
        switch (a) {
            case "LOGIN":
                return <Tag color="green">ĐĂNG NHẬP</Tag>;
            case "LOGOUT":
                return <Tag color="volcano">ĐĂNG XUẤT</Tag>;
            case "ORDER_CREATED":
                return <Tag color="blue">TẠO ĐƠN HÀNG</Tag>;
            case "PAYMENT_RECEIVED":
                return <Tag color="cyan">THANH TOÁN</Tag>;
            case "ORDER_CANCELED":
                return <Tag color="magenta">HỦY ĐƠN</Tag>;
            case "SYSTEM":
                return <Tag color="purple">HỆ THỐNG</Tag>;
            default:
                return <Tag color="default">{a}</Tag>;
        }
    };

    const columns = [
        {
            title: "Thời gian",
            dataIndex: "createdAt",
            width: 150,
            render: (d) => {
                const date = new Date(d);
                return (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <Text strong>{date.toLocaleDateString("vi-VN")}</Text>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                            {date.toLocaleTimeString("vi-VN")}
                        </Text>
                    </div>
                );
            },
        },
        { title: "Hành động", dataIndex: "action", width: 140, render: (a) => getActionTag(a) },
        {
            title: "Mã Đơn",
            width: 100,
            render: (_, record) => {
                const match = record.details?.match(/#(\d{6})/);
                return match ? (
                    <Text strong style={{ color: "#1677ff" }}>
                        #{match[1]}
                    </Text>
                ) : (
                    <Text type="secondary">-</Text>
                );
            },
        },
        {
            title: "Số tiền",
            width: 120,
            render: (_, record) => {
                const match = record.details?.match(/(\d{1,3}(?:\.\d{3})*đ)/);
                return match ? (
                    <Text type="danger" strong>
                        {match[1]}
                    </Text>
                ) : (
                    <Text type="secondary">-</Text>
                );
            },
        },
        {
            title: "Mã GD (Bank)",
            width: 220,
            render: (_, record) => {
                const match = record.details?.match(/Mã GD:\s*([a-zA-Z0-9]+)/);
                return match && match[1] && match[1] !== "undefined" ? (
                    <Text code style={{ whiteSpace: "nowrap" }}>
                        {match[1]}
                    </Text>
                ) : (
                    <Text type="secondary">-</Text>
                );
            },
        },
        {
            title: "Ghi chú",
            dataIndex: "details",
            render: (details) => {
                if (!details) return "";
                if (details.includes("PayOS tự động xác nhận"))
                    return <Text type="success">Xác nhận thanh toán tự động</Text>;
                if (details.includes("Khách hàng hủy thanh toán đơn"))
                    return <Text type="danger">Khách hàng yêu cầu hủy đơn</Text>;
                if (details.includes("Tạo đơn hàng #")) return <Text>Khởi tạo đơn hàng mới</Text>;
                return <Text>{details}</Text>;
            },
        },
    ];

    return (
        <Table
            dataSource={logs}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            scroll={{ x: "max-content" }}
            columns={columns}
        />
    );
}
