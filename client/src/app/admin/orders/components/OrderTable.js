import React from "react";
import { Table, Tag, Select, Button, Typography } from "antd";
import { EyeOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function OrderTable({ orders, loading, onStatusChange, onViewDetails }) {
    const renderStatusTag = (status) => {
        switch (status) {
            case "PENDING":
                return <Tag color="warning">Chờ xử lý</Tag>;
            case "PAID":
                return <Tag color="processing">Đã thanh toán</Tag>;
            case "SHIPPING":
                return <Tag color="blue">Đang giao hàng</Tag>;
            case "COMPLETED":
                return <Tag color="success">Hoàn thành</Tag>;
            case "CANCELED":
                return <Tag color="error">Đã hủy</Tag>;
            default:
                return <Tag>{status}</Tag>;
        }
    };

    const columns = [
        {
            title: "Mã Đơn",
            dataIndex: "orderCode",
            key: "orderCode",
            render: (code, record) => <Text code>{code || record.id?.substring(0, 8)}</Text>,
        },
        {
            title: "Khách hàng",
            key: "user",
            render: (_, record) => record.User?.name || "Khách vãng lai",
        },
        {
            title: "Ngày đặt",
            dataIndex: "createdAt",
            render: (date) => new Date(date).toLocaleString("vi-VN"),
        },
        {
            title: "Tổng tiền",
            dataIndex: "totalAmount",
            render: (price) => (
                <Text type="danger" strong>
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                        price || 0,
                    )}
                </Text>
            ),
        },
        {
            title: "Thanh toán",
            dataIndex: "paymentMethod",
            render: (method) => <Tag color={method === "QR" ? "purple" : "default"}>{method}</Tag>,
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            render: (status) => renderStatusTag(status),
        },
        {
            title: "Cập nhật",
            key: "action",
            render: (_, record) => (
                <Select
                    value={record.status}
                    style={{ width: 140 }}
                    onChange={(val) => onStatusChange(record.id, val)}
                    disabled={record.status === "CANCELED" || record.status === "COMPLETED"}
                    options={[
                        { value: "PENDING", label: "Chờ xử lý" },
                        { value: "PAID", label: "Đã thanh toán" },
                        { value: "SHIPPING", label: "Đang giao" },
                        { value: "COMPLETED", label: "Hoàn thành" },
                        { value: "CANCELED", label: "Hủy đơn" },
                    ]}
                />
            ),
        },
        {
            title: "Chi tiết",
            key: "details",
            render: (_, record) => (
                <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => onViewDetails(record)}
                    size="small"
                >
                    Xem
                </Button>
            ),
        },
    ];

    return (
        <Table
            dataSource={orders}
            columns={columns}
            rowKey="id"
            loading={loading}
            scroll={{ x: "max-content" }}
        />
    );
}
