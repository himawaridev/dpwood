import React from "react";
import { Table, Tag, Space, Button, Typography, Modal, message } from "antd";
import api from "@/utils/axios";

const { Text } = Typography;

export default function MyOrders({ orders, onRefresh }) {
    const getStatusTag = (status) => {
        const s = status?.toUpperCase();
        if (s === "PAID" || s === "COMPLETED") return <Tag color="green">HOÀN TẤT</Tag>;
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
                } catch (error) {
                    message.error("Không thể hủy đơn hàng lúc này");
                }
            },
        });
    };

    const columns = [
        { title: "Mã đơn", dataIndex: "orderCode", render: (c) => <Text code>{c}</Text> },
        {
            title: "Ngày đặt",
            dataIndex: "createdAt",
            render: (d) => new Date(d).toLocaleDateString("vi-VN"),
        },
        {
            title: "Tổng tiền",
            dataIndex: "totalAmount",
            render: (v) => (
                <Text strong style={{ color: "#cf1322" }}>
                    {new Intl.NumberFormat("vi-VN").format(v)}₫
                </Text>
            ),
        },
        {
            title: "Thanh toán",
            dataIndex: "paymentMethod",
            render: (method) => (
                <Tag color={method === "QR" ? "cyan" : "blue"}>
                    {method === "QR" ? "QR Code" : "COD"}
                </Tag>
            ),
        },
        { title: "Trạng thái", dataIndex: "status", render: (s) => getStatusTag(s) },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space>
                    {record.status === "PENDING" && (
                        <Button
                            type="primary"
                            danger
                            size="small"
                            onClick={() => handleCancelOrder(record.orderCode)}
                        >
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
            scroll={{ x: 800 }}
            columns={columns}
        />
    );
}
