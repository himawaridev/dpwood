"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, App, Card, Empty, Spin, Tooltip, Typography } from "antd";
import { RetweetOutlined, ShoppingOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import MyOrders from "@/app/(main)/profile/components/MyOrders";

const { Title, Text } = Typography;

export default function OrdersPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            setHasError(false);
            const response = await api.get("/orders/me");
            setOrders(response.data || []);
        } catch (error) {
            setOrders([]);
            setHasError(true);
            if (error.response?.status === 401) {
                message.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
                localStorage.clear();
                router.push("/login");
            }
        } finally {
            setLoading(false);
        }
    }, [message, router]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("status") === "PAID" || params.get("cancel") === "false") {
            message.success("Thanh toán thành công. Hệ thống đã ghi nhận đơn hàng.");
            window.history.replaceState(null, "", "/orders");
        }
        fetchOrders();
    }, [fetchOrders, message]);

    if (loading) {
        return (
            <div className="dp-page dp-orders-page dp-page-loading">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <main className="dp-page dp-orders-page">
            <div className="dp-container">
                <section className="dp-page-heading dp-orders-heading">
                    <div>
                        <span className="dp-eyebrow">Mua sắm</span>
                        <Title level={1} className="dp-section-title">
                            <ShoppingOutlined /> Đơn hàng của tôi
                        </Title>
                        <Text className="dp-muted">
                            Theo dõi thanh toán, giao hàng, chi tiết sản phẩm và trạng thái từng đơn hàng.
                        </Text>
                    </div>
                    <Tooltip title="Đổi trả hàng">
                        <button
                            type="button"
                            className="dp-outline-link dp-heading-icon-action"
                            onClick={() => router.push("/returns")}
                            aria-label="Đổi trả hàng"
                        >
                            <RetweetOutlined />
                        </button>
                    </Tooltip>
                </section>

                {hasError ? (
                    <Alert
                        className="dp-panel"
                        type="warning"
                        showIcon
                        title="Chưa tải được đơn hàng"
                        description="Server đang đồng bộ dữ liệu đơn hàng. Bạn có thể tải lại trang sau vài giây."
                        action={
                            <button type="button" className="dp-inline-action" onClick={fetchOrders}>
                                Thử lại
                            </button>
                        }
                    />
                ) : orders.length === 0 ? (
                    <Card variant="outlined" className="dp-panel dp-empty-panel">
                        <Empty description="Bạn chưa có đơn hàng nào" />
                    </Card>
                ) : (
                    <Card variant="outlined" className="dp-panel dp-orders-panel">
                        <MyOrders orders={orders} onRefresh={fetchOrders} hasError={false} />
                    </Card>
                )}
            </div>
        </main>
    );
}
