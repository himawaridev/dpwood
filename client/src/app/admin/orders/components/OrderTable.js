import React from "react";
import { Table, Tag, Select, Typography, Modal } from "antd";
import { EyeOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import AdminIconButton from "@/components/ui/AdminIconButton";
import OrderStatusTag from "@/components/order/OrderStatusTag";
import { formatCurrency, formatDateTime } from "@/utils/formatters";
import { getOrderStatusMeta, ORDER_STATUS_OPTIONS } from "@/utils/orderStatus";

const { Text } = Typography;

export default function OrderTable({ orders, loading, onStatusChange, onViewDetails }) {
    const handleStatusSelect = (record, newStatus) => {
        const isDangerous = newStatus === "CANCELED" || record.status === "CANCELED" || record.status === "COMPLETED";

        if (isDangerous) {
            const fromLabel = getOrderStatusMeta(record.status).optionLabel;
            const toLabel = getOrderStatusMeta(newStatus).optionLabel;

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
            render: formatDateTime,
        },
        {
            title: "Tổng tiền",
            dataIndex: "totalAmount",
            render: (price) => (
                <Text type="danger" strong>
                    {formatCurrency(price)}
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
            render: (status) => <OrderStatusTag status={status} />,
        },
        {
            title: "Cập nhật",
            key: "action",
            render: (_, record) => (
                <Select
                    value={record.status}
                    style={{ width: 140 }}
                    onChange={(value) => handleStatusSelect(record, value)}
                    options={ORDER_STATUS_OPTIONS}
                />
            ),
        },
        {
            title: "Hành động",
            key: "details",
            fixed: "right",
            render: (_, record) => (
                <AdminIconButton
                    label="Xem chi tiết đơn hàng"
                    icon={<EyeOutlined />}
                    onClick={() => onViewDetails(record)}
                />
            ),
        },
    ];

    return <Table dataSource={orders} columns={columns} rowKey="id" loading={loading} scroll={{ x: "max-content" }} />;
}
