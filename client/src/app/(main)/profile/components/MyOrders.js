"use client";

import React from "react";
import { App, Table, Tag, Button, Typography, Modal, Empty, Alert } from "antd";
import api from "@/utils/axios";

const { Text } = Typography;

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

export default function MyOrders({ orders, onRefresh, hasError }) {
    const { message } = App.useApp();

    const getStatusTag = (status) => {
        const normalizedStatus = status?.toUpperCase();
        if (normalizedStatus === "PAID") return <Tag color="green">Đã thanh toán</Tag>;
        if (normalizedStatus === "COMPLETED") return <Tag color="green">Hoàn tất</Tag>;
        if (normalizedStatus === "PENDING") return <Tag color="orange">Chờ xử lý</Tag>;
        if (normalizedStatus === "SHIPPING") return <Tag color="blue">Đang giao</Tag>;
        if (normalizedStatus === "CANCELED" || normalizedStatus === "CANCELLED") return <Tag color="red">Đã hủy</Tag>;
        return <Tag>{normalizedStatus || "N/A"}</Tag>;
    };

    const handleCancelOrder = (orderCode) => {
        Modal.confirm({
            title: "Xác nhận hủy đơn hàng",
            content: "Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.",
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
            render: (method) => <Tag color={method === "QR" ? "cyan" : "#f09b90"}>{method === "QR" ? "QR PayOS" : "COD"}</Tag>,
        },
        { title: "Trạng thái", dataIndex: "status", render: (status) => getStatusTag(status) },
        {
            title: "",
            key: "action",
            align: "right",
            render: (_, record) =>
                record.status === "PENDING" ? (
                    <Button danger size="small" onClick={() => handleCancelOrder(record.orderCode)}>
                        Hủy đơn
                    </Button>
                ) : null,
        },
    ];

    if (hasError) {
        return (
            <Alert
                type="warning"
                showIcon
                title="Chưa tải được đơn hàng"
                description="Server đang đồng bộ dữ liệu đơn hàng. Bạn có thể tải lại trang sau vài giây."
            />
        );
    }

    return (
        <Table
            className="dp-profile-table"
            dataSource={orders}
            rowKey="id"
            pagination={{ pageSize: 5, showSizeChanger: false }}
            scroll={{ x: 820 }}
            columns={columns}
            locale={{
                emptyText: <Empty description="Bạn chưa có đơn hàng nào" />,
            }}
            expandable={{
                expandedRowRender: (record) => (
                    <div className="dp-profile-order-items">
                        {(record.OrderItems || []).map((item) => (
                            <div className="dp-profile-order-item" key={item.id}>
                                <span>{item.Product?.name || "Sản phẩm"}</span>
                                <Text type="secondary">
                                    x{item.quantity} - {formatCurrency(item.priceAtPurchase)}
                                </Text>
                            </div>
                        ))}
                    </div>
                ),
                rowExpandable: (record) => Boolean(record.OrderItems?.length),
            }}
        />
    );
}
