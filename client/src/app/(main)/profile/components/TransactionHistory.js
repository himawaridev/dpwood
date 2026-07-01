import React from "react";
import { Table, Tag, Typography } from "antd";

const { Text } = Typography;

export default function TransactionHistory({ logs }) {
    const getActionTag = (action) => {
        const normalizedAction = action?.toUpperCase();
        switch (normalizedAction) {
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
            case "ADMIN_UPDATE_ORDER":
                return <Tag color="purple">QTV CẬP NHẬT</Tag>;
            case "SYSTEM":
                return <Tag color="purple">HỆ THỐNG</Tag>;
            default:
                return <Tag color="default">{normalizedAction}</Tag>;
        }
    };

    const columns = [
        {
            title: "Thời gian",
            dataIndex: "createdAt",
            width: 150,
            render: (value) => {
                const date = new Date(value);
                return (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <Text strong>{date.toLocaleDateString("vi-VN")}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {date.toLocaleTimeString("vi-VN")}
                        </Text>
                    </div>
                );
            },
        },
        { title: "Hành động", dataIndex: "action", width: 150, render: (action) => getActionTag(action) },
        {
            title: "Mã đơn",
            width: 110,
            render: (_, record) => {
                const match = record.details?.match(/#(\d{6})/);
                return match ? <Text code>#{match[1]}</Text> : <Text type="secondary">-</Text>;
            },
        },
        {
            title: "Số tiền",
            width: 140,
            render: (_, record) => {
                const match = record.details?.match(/(\d{1,3}(?:\.\d{3})*đ)/);
                return match ? <Text className="dp-price">{match[1]}</Text> : <Text type="secondary">-</Text>;
            },
        },
        {
            title: "Mã giao dịch",
            width: 200,
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
                if (details.includes("hủy") || details.includes("Hủy"))
                    return <Text type="danger">Yêu cầu hủy đơn</Text>;
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
