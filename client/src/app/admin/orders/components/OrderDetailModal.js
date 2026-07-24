import React, { useEffect, useState } from "react";
import {
    App,
    Modal,
    Descriptions,
    Typography,
    Image,
    Button,
    Form,
    Input,
    Select,
    DatePicker,
    Row,
    Col,
    Divider,
} from "antd";
import dayjs from "dayjs";
import api from "@/utils/axios";
import { formatCurrency } from "@/utils/formatters";
import OrderStatusTag from "@/components/order/OrderStatusTag";

const { Title, Text } = Typography;

export default function OrderDetailModal({ isVisible, onClose, selectedOrder, onRefresh }) {
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const [savingShipment, setSavingShipment] = useState(false);
    const shipment = selectedOrder?.Shipment || selectedOrder?.shipment || {};

    useEffect(() => {
        if (!isVisible || !selectedOrder) return;
        form.setFieldsValue({
            carrier: shipment.carrier,
            service: shipment.service,
            trackingCode: shipment.trackingCode,
            status: shipment.status || "READY",
            estimatedDeliveryAt: shipment.estimatedDeliveryAt
                ? dayjs(shipment.estimatedDeliveryAt)
                : null,
        });
    }, [form, isVisible, selectedOrder, shipment.carrier, shipment.estimatedDeliveryAt, shipment.service, shipment.status, shipment.trackingCode]);

    const saveShipment = async () => {
        try {
            const values = await form.validateFields();
            setSavingShipment(true);
            await api.put(`/commerce/orders/${selectedOrder.id}/shipment`, {
                ...values,
                estimatedDeliveryAt: values.estimatedDeliveryAt?.toISOString() || null,
            });
            message.success("Đã cập nhật vận đơn.");
            await onRefresh?.();
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error.response?.data?.message || "Không thể cập nhật vận đơn.");
        } finally {
            setSavingShipment(false);
        }
    };
    const getModalDescriptionItems = () => [
        {
            key: "1",
            label: "Người nhận",
            children: <Text strong>{selectedOrder?.shippingName || "-"}</Text>,
        },
        {
            key: "2",
            label: "Số điện thoại",
            children: selectedOrder?.shippingPhone ? <Text copyable>{selectedOrder.shippingPhone}</Text> : "-",
        },
        { key: "3", label: "Địa chỉ", children: selectedOrder?.shippingAddress || "-" },
        { key: "4", label: "Tài khoản", children: selectedOrder?.User?.email || selectedOrder?.user?.email || "-" },
    ];

    return (
        <Modal
            title="Chi tiết đơn hàng"
            open={isVisible}
            onCancel={onClose}
            footer={[
                <Button key="close" type="primary" onClick={onClose}>
                    Đóng
                </Button>,
            ]}
            width={760}
            destroyOnHidden
            mask={{ closable: false }}
        >
            {selectedOrder && (
                <div className="dp-admin-order-detail">
                    <div className="dp-admin-order-summary">
                        <div>
                            <Text type="secondary">Mã đơn: </Text>
                            <Text strong style={{ fontSize: 16 }}>
                                #{selectedOrder.orderCode}
                            </Text>
                        </div>
                        <div><OrderStatusTag status={selectedOrder.status} /></div>
                    </div>

                    <Descriptions
                        title="Thông tin giao hàng"
                        bordered
                        column={1}
                        size="small"
                        items={getModalDescriptionItems()}
                    />

                    <Divider orientation="left">Vận chuyển</Divider>
                    <Form form={form} layout="vertical">
                        <Row gutter={12}>
                            <Col xs={24} sm={12}>
                                <Form.Item name="carrier" label="Đơn vị vận chuyển">
                                    <Input placeholder="VD: GHN, GHTK, Viettel Post" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item name="service" label="Dịch vụ">
                                    <Input placeholder="VD: Giao tiêu chuẩn" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item name="trackingCode" label="Mã vận đơn">
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item name="status" label="Trạng thái vận chuyển">
                                    <Select
                                        options={[
                                            { value: "READY", label: "Sẵn sàng bàn giao" },
                                            { value: "PICKED_UP", label: "Đã lấy hàng" },
                                            { value: "IN_TRANSIT", label: "Đang vận chuyển" },
                                            { value: "DELIVERED", label: "Đã giao" },
                                            { value: "FAILED", label: "Giao thất bại" },
                                            { value: "RETURNED", label: "Hoàn về" },
                                        ]}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item name="estimatedDeliveryAt" label="Ngày giao dự kiến">
                                    <DatePicker showTime style={{ width: "100%" }} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} style={{ display: "flex", alignItems: "end" }}>
                                <Button
                                    type="primary"
                                    block
                                    loading={savingShipment}
                                    onClick={saveShipment}
                                    style={{ marginBottom: 24 }}
                                >
                                    Lưu vận đơn
                                </Button>
                            </Col>
                        </Row>
                    </Form>

                    <div>
                        <Title level={5} style={{ marginBottom: 16 }}>
                            Sản phẩm đã mua
                        </Title>
                        <div className="dp-admin-order-items">
                            {selectedOrder.OrderItems && selectedOrder.OrderItems.length > 0 ? (
                                selectedOrder.OrderItems.map((item) => (
                                    <div key={item.id} className="dp-admin-order-item">
                                        <div className="dp-admin-order-product">
                                            <Image
                                                src={
                                                    item.Product?.imageUrl ||
                                                    item.Product?.image ||
                                                    "https://via.placeholder.com/60?text=No+Image"
                                                }
                                                alt={item.Product?.name || "Sản phẩm"}
                                                width={64}
                                                height={64}
                                                style={{ objectFit: "cover", border: "1px solid #e8e8e8" }}
                                                preview={{
                                                    src: item.Product?.imageUrl || item.Product?.image,
                                                }}
                                            />
                                            <div>
                                                <Text strong style={{ fontSize: 15 }}>
                                                    {item.Product?.name || "Sản phẩm đã bị xóa"}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: 13, display: "block" }}>
                                                    Đơn giá: {formatCurrency(item.priceAtPurchase)}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: 13, display: "block" }}>
                                                    Số lượng: <Text strong>{item.quantity}</Text>
                                                </Text>
                                            </div>
                                        </div>
                                        <Text strong style={{ fontSize: 16, color: "#cf1322" }}>
                                            {formatCurrency((item.priceAtPurchase || 0) * item.quantity)}
                                        </Text>
                                    </div>
                                ))
                            ) : (
                                <Text type="secondary" italic>
                                    Không có thông tin sản phẩm cho đơn hàng này.
                                </Text>
                            )}
                        </div>
                        <div className="dp-admin-order-total">
                            <Title level={4} style={{ margin: 0 }}>
                                Tổng cộng: <Text style={{ color: "#cf1322" }}>{formatCurrency(selectedOrder.totalAmount)}</Text>
                            </Title>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}
