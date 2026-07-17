"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { App, Table, Tag, Button, Typography, Modal, Empty, Alert, Descriptions, Image, Steps, Tooltip } from "antd";
import { CloseCircleOutlined, EyeOutlined, QrcodeOutlined } from "@ant-design/icons";
import api from "@/utils/axios";
import PaymentQRModal from "@/app/(main)/cart/components/PaymentQRModal";
import { formatCurrency } from "@/utils/formatters";

const { Text, Title } = Typography;

const getProductImage = (product) => {
    if (!product) return null;
    if (product.imageUrl) return product.imageUrl;
    if (Array.isArray(product.images) && product.images.length > 0) return product.images[0];
    return null;
};

export default function MyOrders({ orders, onRefresh, hasError }) {
    const { message } = App.useApp();
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [paymentOrder, setPaymentOrder] = useState(null);
    const [payosData, setPayosData] = useState(null);
    const [openingPaymentCode, setOpeningPaymentCode] = useState("");
    const [checkingPayment, setCheckingPayment] = useState(false);
    const [cancelingPayment, setCancelingPayment] = useState(false);

    const orderItems = useMemo(() => selectedOrder?.OrderItems || [], [selectedOrder]);
    const itemsSubtotal = orderItems.reduce(
        (sum, item) => sum + Number(item.priceAtPurchase || 0) * Number(item.quantity || 0),
        0,
    );
    const discountAmount = Number(selectedOrder?.discountAmount || 0);

    const closePaymentModal = useCallback(() => {
        setPaymentOrder(null);
        setPayosData(null);
        setCheckingPayment(false);
    }, []);

    const handleOpenPayment = async (order) => {
        try {
            setOpeningPaymentCode(String(order.orderCode));
            const response = await api.get(`/orders/${order.orderCode}/payment-link`);
            const expiresAt = response.data?.expiresAt;
            setPayosData({
                ...(response.data?.payosData || {}),
                expiredAt:
                    response.data?.payosData?.expiredAt ||
                    (expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : null),
            });
            setPaymentOrder({ ...order, paymentExpiresAt: expiresAt });
            setSelectedOrder(null);
        } catch (error) {
            const status = error.response?.status;
            const errorMessage = error.response?.data?.message || "Không thể mở lại thanh toán PayOS lúc này.";
            if (status === 410) message.warning(errorMessage);
            else if (status === 409) message.info(errorMessage);
            else message.error(errorMessage);
            if ([409, 410].includes(status)) await onRefresh();
        } finally {
            setOpeningPaymentCode("");
        }
    };

    const handleCancelPayment = async () => {
        if (!paymentOrder?.orderCode || cancelingPayment) return;
        try {
            setCancelingPayment(true);
            const response = await api.put(`/orders/${paymentOrder.orderCode}/cancel`);
            message.success(response.data?.message || "Đã hủy đơn hàng.");
            closePaymentModal();
            await onRefresh();
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể hủy đơn hàng lúc này.");
        } finally {
            setCancelingPayment(false);
        }
    };

    useEffect(() => {
        if (!paymentOrder?.orderCode) return undefined;

        let active = true;
        let polling = false;
        setCheckingPayment(true);

        const pollPayment = async () => {
            if (!active || polling) return;
            polling = true;
            try {
                const response = await api.get(`/orders/${paymentOrder.orderCode}/status`);
                const status = String(response.data?.status || response.data?.paymentStatus || "").toUpperCase();
                const paymentStatus = String(response.data?.paymentStatus || "").toUpperCase();

                if (status === "PAID" || paymentStatus === "PAID") {
                    message.success("Thanh toán thành công. Đơn hàng đã được cập nhật.");
                    closePaymentModal();
                    await onRefresh();
                    active = false;
                } else if (
                    status === "CANCELED" ||
                    ["CANCELED", "CANCELLED", "EXPIRED"].includes(paymentStatus)
                ) {
                    message.warning("Mã QR đã hết hạn hoặc đơn hàng đã được hủy.");
                    closePaymentModal();
                    await onRefresh();
                    active = false;
                }
            } catch {
                // A transient status failure is retried by the next polling cycle.
            } finally {
                polling = false;
            }
        };

        pollPayment();
        const intervalId = window.setInterval(pollPayment, 2500);
        return () => {
            active = false;
            window.clearInterval(intervalId);
            setCheckingPayment(false);
        };
    }, [closePaymentModal, message, onRefresh, paymentOrder?.orderCode]);

    const getStatusTag = (status, paymentMethod) => {
        const normalizedStatus = status?.toUpperCase();
        if (normalizedStatus === "PAID") return <Tag color="green">Đã thanh toán</Tag>;
        if (normalizedStatus === "COMPLETED") return <Tag color="green">Hoàn tất</Tag>;
        if (normalizedStatus === "PENDING") {
            return <Tag color="orange">{paymentMethod === "QR" ? "Chờ thanh toán" : "Chờ xử lý"}</Tag>;
        }
        if (normalizedStatus === "SHIPPING") return <Tag color="blue">Đang giao</Tag>;
        if (normalizedStatus === "CANCELED" || normalizedStatus === "CANCELLED") {
            return <Tag color="red">Đã hủy</Tag>;
        }
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
                    message.success("Đã hủy đơn hàng thành công.");
                    onRefresh();
                    setSelectedOrder(null);
                } catch {
                    message.error("Không thể hủy đơn hàng lúc này.");
                }
            },
        });
    };

    const columns = [
        {
            title: "Mã đơn",
            dataIndex: "orderCode",
            render: (code) => <Text code>#{code}</Text>,
        },
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
            render: (method) => (
                <Tag color={method === "QR" ? "cyan" : "#f09b90"}>{method === "QR" ? "QR PayOS" : "COD"}</Tag>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            render: (status, record) => getStatusTag(status, record.paymentMethod),
        },
        {
            title: "",
            key: "action",
            align: "right",
            render: (_, record) => (
                <div className="dp-order-actions">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="text"
                            size="small"
                            className="dp-order-view-button"
                            icon={<EyeOutlined />}
                            onClick={() => setSelectedOrder(record)}
                            aria-label="Xem chi tiết đơn hàng"
                        />
                    </Tooltip>
                    {record.status === "PENDING" && (
                        <Tooltip title="Hủy đơn hàng">
                            <Button
                                danger
                                type="text"
                                size="small"
                                icon={<CloseCircleOutlined />}
                                aria-label="Hủy đơn hàng"
                                onClick={() => handleCancelOrder(record.orderCode)}
                            />
                        </Tooltip>
                    )}
                </div>
            ),
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
        <>
            <Table
                className="dp-profile-table"
                dataSource={orders}
                rowKey="id"
                pagination={{ pageSize: 5, showSizeChanger: false }}
                scroll={{ x: 860 }}
                columns={columns}
                locale={{
                    emptyText: <Empty description="Bạn chưa có đơn hàng nào" />,
                }}
            />

            <Modal
                title={selectedOrder ? `Chi tiết đơn hàng #${selectedOrder.orderCode}` : "Chi tiết đơn hàng"}
                open={Boolean(selectedOrder)}
                onCancel={() => setSelectedOrder(null)}
                footer={[
                    selectedOrder?.status === "PENDING" &&
                    selectedOrder?.paymentMethod === "QR" &&
                    selectedOrder?.canResumePayment !== false ? (
                        <Button
                            key="resume-payment"
                            type="primary"
                            icon={<QrcodeOutlined />}
                            loading={openingPaymentCode === String(selectedOrder.orderCode)}
                            onClick={() => handleOpenPayment(selectedOrder)}
                        >
                            Thanh toán
                        </Button>
                    ) : null,
                    selectedOrder?.status === "PENDING" ? (
                        <Tooltip key="cancel-order" title="Hủy đơn hàng">
                            <Button
                                danger
                                type="text"
                                icon={<CloseCircleOutlined />}
                                aria-label="Hủy đơn hàng"
                                onClick={() => handleCancelOrder(selectedOrder.orderCode)}
                            />
                        </Tooltip>
                    ) : null,
                    <Button key="close" type="primary" onClick={() => setSelectedOrder(null)}>
                        Đóng
                    </Button>,
                ]}
                width={780}
                destroyOnHidden
                maskClosable={false}
            >
                {selectedOrder && (
                    <div className="dp-order-detail">
                        <div className="dp-order-detail-summary">
                            <div>
                                <Text type="secondary">Trạng thái</Text>
                                <div>{getStatusTag(selectedOrder.status, selectedOrder.paymentMethod)}</div>
                            </div>
                            <div>
                                <Text type="secondary">Ngày đặt</Text>
                                <Text strong>{new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}</Text>
                            </div>
                            <div>
                                <Text type="secondary">Thanh toán</Text>
                                <Text strong>{selectedOrder.paymentMethod === "QR" ? "QR PayOS" : "COD"}</Text>
                            </div>
                        </div>

                        {selectedOrder.status === "PENDING" && selectedOrder.paymentMethod === "QR" && (
                            <Alert
                                type={selectedOrder.canResumePayment === false ? "warning" : "info"}
                                showIcon
                                title={
                                    selectedOrder.canResumePayment === false
                                        ? "Mã QR đã hết thời hạn thanh toán"
                                        : "Đơn hàng đang chờ thanh toán QR"
                                }
                                description={
                                    selectedOrder.canResumePayment === false
                                        ? "Hệ thống đang đồng bộ trạng thái hủy và hoàn lại tồn kho."
                                        : "Bạn có thể tiếp tục thanh toán trong vòng 10 phút kể từ lúc tạo đơn."
                                }
                            />
                        )}

                        {selectedOrder.timeline?.length > 0 && (
                            <div className="dp-order-timeline">
                                <Title level={5}>Tiến trình đơn hàng</Title>
                                <Steps
                                    responsive
                                    items={selectedOrder.timeline.map((item) => ({
                                        title: item.title,
                                        status: item.status,
                                        description: (
                                            <span>
                                                {item.description}
                                                {item.date && (
                                                    <small>{new Date(item.date).toLocaleString("vi-VN")}</small>
                                                )}
                                            </span>
                                        ),
                                    }))}
                                />
                            </div>
                        )}

                        <Descriptions
                            title="Thông tin giao hàng"
                            bordered
                            size="small"
                            column={1}
                            items={[
                                {
                                    key: "name",
                                    label: "Người nhận",
                                    children: <Text strong>{selectedOrder.shippingName || "Chưa có"}</Text>,
                                },
                                {
                                    key: "phone",
                                    label: "Số điện thoại",
                                    children: selectedOrder.shippingPhone ? (
                                        <Text copyable>{selectedOrder.shippingPhone}</Text>
                                    ) : (
                                        "Chưa có"
                                    ),
                                },
                                {
                                    key: "address",
                                    label: "Địa chỉ",
                                    children: selectedOrder.shippingAddress || "Chưa có",
                                },
                            ]}
                        />

                        <div>
                            <Title level={5} style={{ marginBottom: 12 }}>
                                Sản phẩm trong đơn
                            </Title>
                            <div className="dp-order-detail-items">
                                {orderItems.length > 0 ? (
                                    orderItems.map((item) => {
                                        const imageUrl = getProductImage(item.Product);
                                        const lineTotal = Number(item.priceAtPurchase || 0) * Number(item.quantity || 0);

                                        return (
                                            <div className="dp-order-detail-item" key={item.id}>
                                                <div className="dp-order-detail-product">
                                                    {imageUrl ? (
                                                        <Image
                                                            src={imageUrl}
                                                            alt={item.Product?.name || "Sản phẩm"}
                                                            width={64}
                                                            height={64}
                                                            preview={{ src: imageUrl }}
                                                            className="dp-order-detail-image"
                                                        />
                                                    ) : (
                                                        <div className="dp-order-detail-image-placeholder">DP</div>
                                                    )}
                                                    <div>
                                                        <Text strong>{item.Product?.name || "Sản phẩm đã bị xóa"}</Text>
                                                        <div className="dp-muted">
                                                            Đơn giá: {formatCurrency(item.priceAtPurchase)}
                                                        </div>
                                                        <div className="dp-muted">Số lượng: {item.quantity}</div>
                                                    </div>
                                                </div>
                                                <Text strong className="dp-price">
                                                    {formatCurrency(lineTotal)}
                                                </Text>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <Empty description="Không có thông tin sản phẩm cho đơn hàng này" />
                                )}
                            </div>
                        </div>

                        <div className="dp-order-detail-total">
                            <div>
                                <Text type="secondary">Tạm tính</Text>
                                <Text strong>{formatCurrency(itemsSubtotal)}</Text>
                            </div>
                            {discountAmount > 0 && (
                                <div>
                                    <Text type="secondary">Giảm giá</Text>
                                    <Text strong>-{formatCurrency(discountAmount)}</Text>
                                </div>
                            )}
                            {selectedOrder.discountCode && (
                                <div>
                                    <Text type="secondary">Mã giảm giá</Text>
                                    <Tag color="#f09b90">{selectedOrder.discountCode}</Tag>
                                </div>
                            )}
                            <div className="dp-order-detail-grand-total">
                                <Text strong>Tổng thanh toán</Text>
                                <Text strong className="dp-price">
                                    {formatCurrency(selectedOrder.totalAmount)}
                                </Text>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <PaymentQRModal
                isQrModalVisible={Boolean(paymentOrder)}
                payosData={payosData}
                checkingPayment={checkingPayment}
                cancelingPayment={cancelingPayment}
                handleCancelPayment={handleCancelPayment}
            />
        </>
    );
}
