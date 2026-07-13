import React from "react";
import { Table, Tag, Select, Button, Typography, Modal, Tooltip } from "antd";
import { EyeOutlined, ExclamationCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

const STATUS_LABELS = {
    PENDING: "Chờ xử lý",
    PAID: "Đã thanh toán",
    SHIPPING: "Đang giao",
    COMPLETED: "Hoàn thành",
    CANCELED: "Hủy đơn",
};

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

    const handleStatusSelect = (record, newStatus) => {
        const isDangerous = newStatus === "CANCELED" || record.status === "CANCELED" || record.status === "COMPLETED";

        if (isDangerous) {
            const fromLabel = STATUS_LABELS[record.status] || record.status;
            const toLabel = STATUS_LABELS[newStatus] || newStatus;

            Modal.confirm({
                title: "Xác nhận thay đổi trạng thái",
                icon: <ExclamationCircleOutlined />,
                content: (
                    <div>
                        Bạn có chắc muốn chuyển đơn <Text strong>#{record.orderCode}</Text> từ{" "}
                        <Text strong>{fromLabel}</Text> sang <Text strong>{toLabel}</Text>?
                        {newStatus === "CANCELED" && (
                            <div style={{ marginTop: 8, color: "#ff4d4f" }}>
                                Hủy đơn có thể ảnh hưởng tới tồn kho và lịch sử xử lý.
                            </div>
                        )}
                        {record.status === "CANCELED" && (
                            <div style={{ marginTop: 8, color: "#faad14" }}>
                                Đơn đang ở trạng thái đã hủy. Vui lòng kiểm tra kỹ trước khi khôi phục.
                            </div>
                        )}
                    </div>
                ),
                okText: "Xác nhận",
                cancelText: "Hủy bỏ",
                okButtonProps: { danger: newStatus === "CANCELED" },
                onOk: () => onStatusChange(record.id, newStatus),
            });
        } else {
            onStatusChange(record.id, newStatus);
        }
    };

    const columns = [
        {
            title: "Mã đơn",
            dataIndex: "orderCode",
            key: "orderCode",
            render: (code, record) => <Text code>{code || record.id?.substring(0, 8)}</Text>,
        },
        {
            title: "Khách hàng",
            key: "user",
            render: (_, record) => record.User?.name || record.user?.name || "Khách vãng lai",
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
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price || 0)}
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
                    onChange={(value) => handleStatusSelect(record, value)}
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
            fixed: "right",
            render: (_, record) => (
                <Tooltip title="Xem chi tiết đơn hàng">
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        aria-label="Xem chi tiết đơn hàng"
                        onClick={() => onViewDetails(record)}
                        size="small"
                        style={{ color: "#f09b90" }}
                    />
                </Tooltip>
            ),
        },
    ];

    return <Table dataSource={orders} columns={columns} rowKey="id" loading={loading} scroll={{ x: "max-content" }} />;
}
