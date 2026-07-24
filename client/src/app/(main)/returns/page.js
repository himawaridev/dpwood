"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, App, Card, Col, Empty, Row, Spin, Tag, Tooltip, Typography } from "antd";
import { EyeOutlined, RetweetOutlined, ShoppingOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import { formatCurrency } from "@/utils/formatters";

const { Title, Text } = Typography;

const STATUS_LABELS = {
    REQUESTED: ["Mới yêu cầu", "processing"],
    APPROVED: ["Đã duyệt", "success"],
    REJECTED: ["Từ chối", "error"],
    IN_TRANSIT: ["Đang gửi trả", "warning"],
    RECEIVED: ["Đã nhận hàng trả", "blue"],
    COMPLETED: ["Hoàn tất", "success"],
};

export default function ReturnsPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const loadReturns = useCallback(async () => {
        try {
            setLoading(true);
            setHasError(false);
            const response = await api.get("/commerce/returns/me");
            setItems(response.data || []);
        } catch (error) {
            setItems([]);
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
        loadReturns();
    }, [loadReturns]);

    if (loading) {
        return (
            <div className="dp-page dp-returns-page dp-page-loading">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <main className="dp-page dp-returns-page">
            <div className="dp-container">
                <section className="dp-page-heading dp-returns-heading">
                    <div>
                        <span className="dp-eyebrow">Hỗ trợ sau mua</span>
                        <Title level={1} className="dp-section-title">
                            <RetweetOutlined /> Đổi trả hàng
                        </Title>
                        <Text className="dp-muted">
                            Xem tiến độ yêu cầu đổi trả và kết quả xử lý từ DPWOOD.
                        </Text>
                    </div>
                    <Tooltip title="Đơn hàng của tôi">
                        <button
                            type="button"
                            className="dp-outline-link dp-heading-icon-action"
                            onClick={() => router.push("/orders")}
                            aria-label="Đơn hàng của tôi"
                        >
                            <ShoppingOutlined />
                        </button>
                    </Tooltip>
                </section>

                {hasError ? (
                    <Alert
                        className="dp-panel"
                        type="warning"
                        showIcon
                        title="Chưa tải được yêu cầu đổi trả"
                        description="Vui lòng thử lại sau khi hệ thống đồng bộ xong dữ liệu."
                        action={
                            <button type="button" className="dp-inline-action" onClick={loadReturns}>
                                Thử lại
                            </button>
                        }
                    />
                ) : items.length === 0 ? (
                    <Card variant="outlined" className="dp-panel dp-empty-panel">
                        <Empty description="Bạn chưa có yêu cầu đổi trả nào" />
                    </Card>
                ) : (
                    <Row gutter={[16, 16]} className="dp-returns-grid">
                        {items.map((item) => {
                            const [label, color] = STATUS_LABELS[item.status] || [item.status, "default"];
                            return (
                                <Col xs={24} md={12} key={item.id}>
                                    <Card variant="outlined" className="dp-panel dp-return-card">
                                        <div className="dp-return-card-header">
                                            <div>
                                                <Text type="secondary">Mã đơn hàng</Text>
                                                <Text strong code>
                                                    #{item.Order?.orderCode || "N/A"}
                                                </Text>
                                            </div>
                                            <Tag color={color}>{label}</Tag>
                                        </div>
                                        <div className="dp-return-card-content">
                                            <div>
                                                <Text type="secondary">Lý do</Text>
                                                <Text strong>{item.reason}</Text>
                                            </div>
                                            <div>
                                                <Text type="secondary">Giá trị hoàn dự kiến</Text>
                                                <Text strong className="dp-price">
                                                    {formatCurrency(item.refundAmount || 0)}
                                                </Text>
                                            </div>
                                            <div>
                                                <Text type="secondary">Gửi yêu cầu lúc</Text>
                                                <Text>{new Date(item.createdAt).toLocaleString("vi-VN")}</Text>
                                            </div>
                                            {item.resolutionNote && (
                                                <div className="dp-return-note">
                                                    <Text type="secondary">Phản hồi từ DPWOOD</Text>
                                                    <Text>{item.resolutionNote}</Text>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            className="dp-outline-link dp-return-order-link"
                                            onClick={() => router.push("/orders")}
                                        >
                                            <EyeOutlined /> Xem đơn hàng
                                        </button>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </div>
        </main>
    );
}
