"use client";

import React from "react";
import { App, Table, Tag, Space, Button, Typography, Modal } from "antd";
import api from "@/utils/axios";

const { Text } = Typography;

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

export default function MyOrders({ orders, onRefresh }) {
    const { message } = App.useApp();

    const getStatusTag = (status) => {
        const s = status?.toUpperCase();
        if (s === "PAID") return <Tag color="green">ĐÃ THANH TOÁN</Tag>;
        if (s === "COMPLETED") return <Tag color="green">HOÀN TẤT</Tag>;
        if (s === "PENDING") return <Tag color="orange">CHỜ XỬ LÝ</Tag>;
        if (s === "SHIPPING") return <Tag color="blue">ĐANG GIAO</Tag>;
        if (s === "CANCELED" || s === "CANCELLED") return <Tag color="red">ĐÃ HỦY</Tag>;
        return <Tag color="default">{s || "N/A"}</Tag>;
    };

    const handleCancelOrder = (orderCode) => {
        Modal.confirm({
            title: "Xác nhận hủy đơn hàng",
            content:
                "Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.",
            okText: "Hủy đơn ngay",
            okType: "danger",
            cancelText: "Quay lại",
            onOk: async () => {
                try {
                    await api.put(`/orders/${orderCode}/cancel`);
                    message.success("Đã hủy đơn hàng thành công");
                    onRefresh();
                } catch {
                    message.error("Không thể hủy đơn hàng lúc này");
                }
            },
        });
    };

    const columns = [
        { title: "Mã đơn", dataIndex: "orderCode", render: (code) => <Text code>{code}</Text> },
        {
            title: "Ngày đặt",
            dataIndex: "createdAt",
            render: (date) => new Date(date).toLocaleDateString("vi-VN"),
        },
        {
            title: "Tổng tiền",
            dataIndex: "totalAmount",
            render: (value) => <Text className="dp-price">{formatCurrency(value)}</Text>,
        },
        {
            title: "Thanh toán",
            dataIndex: "paymentMethod",
            render: (method) => <Tag color={method === "QR" ? "cyan" : "blue"}>{method === "QR" ? "QR PayOS" : "COD"}</Tag>,
        },
        { title: "Trạng thái", dataIndex: "status", render: (status) => getStatusTag(status) },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space>
                    {record.status === "PENDING" && (
                        <Button danger size="small" onClick={() => handleCancelOrder(record.orderCode)}>
                            Hủy đơn
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <Table
            dataSource={orders}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            scroll={{ x: 820 }}
            columns={columns}
        />
    );
}
