"use client";

import React, { useCallback, useEffect, useState } from "react";
import { App, Card, Tabs, Spin, Typography, Row, Col, Statistic, Alert } from "antd";
import {
    ShoppingOutlined,
    HistoryOutlined,
    CheckCircleOutlined,
    WalletOutlined,
    SafetyCertificateOutlined,
} from "@ant-design/icons";
import api from "@/utils/axios";
import { useRouter } from "next/navigation";
import UserInfo from "./components/UserInfo";
import EditProfileModal from "./components/EditProfileModal";
import TransactionHistory from "./components/TransactionHistory";
import SecurityPanel from "./components/SecurityPanel";

const { Title, Text } = Typography;

export default function UserProfilePage() {
    const { message } = App.useApp();
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ordersError, setOrdersError] = useState(false);
    const [logsError, setLogsError] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const router = useRouter();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setOrdersError(false);
            setLogsError(false);

            const [userRes, ordersRes, logsRes] = await Promise.allSettled([
                api.get("/users/me"),
                api.get("/orders/me"),
                api.get("/users/logs?me=true"),
            ]);

            if (userRes.status === "rejected") {
                throw userRes.reason;
            }

            setUser(userRes.value.data);

            if (ordersRes.status === "fulfilled") {
                setOrders(ordersRes.value.data || []);
            } else {
                setOrders([]);
                setOrdersError(true);
            }

            if (logsRes.status === "fulfilled") {
                setLogs(logsRes.value.data || []);
            } else {
                setLogs([]);
                setLogsError(true);
            }
        } catch (error) {
            console.error("Lỗi tải hồ sơ:", error);
            if (error.response?.status === 401) {
                message.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.");
                localStorage.clear();
                router.push("/login");
            } else {
                message.error("Không thể tải dữ liệu cá nhân.");
            }
        } finally {
            setLoading(false);
        }
    }, [message, router]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("status") === "PAID" || params.get("cancel") === "false") {
            message.success("Thanh toán thành công. Hệ thống đã ghi nhận đơn hàng.");
            window.history.replaceState(null, "", "/profile");
        }
        fetchData();
    }, [fetchData, message]);

    const handledOrders = orders.filter((order) =>
        ["PAID", "COMPLETED", "SHIPPING"].includes(order.status),
    );
    const totalSpent = handledOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    const tabItems = [
        {
            key: "transactions",
            label: (
                <span>
                    <HistoryOutlined /> Hoạt động
                </span>
            ),
            children: <TransactionHistory logs={logs} hasError={logsError} />,
        },
        {
            key: "security",
            label: (
                <span>
                    <SafetyCertificateOutlined /> Bảo mật
                </span>
            ),
            children: <SecurityPanel user={user} onRefresh={fetchData} />,
        },
    ];

    if (loading) {
        return (
            <div className="dp-page" style={{ display: "grid", placeItems: "center" }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="dp-page dp-profile-page">
            <div className="dp-container">
                <section className="dp-profile-heading">
                    <div>
                        <span className="dp-eyebrow">Tài khoản</span>
                        <Title level={1} className="dp-section-title">
                            Hồ sơ cá nhân
                        </Title>
                    </div>
                    <Text className="dp-muted">
                        Quản lý thông tin mua hàng, đơn hàng và lịch sử hoạt động tại DPWOOD.
                    </Text>
                </section>

                {(ordersError || logsError) && (
                    <Alert
                        className="dp-profile-alert"
                        type="warning"
                        showIcon
                        title="Một số dữ liệu chưa tải được"
                        description="Thông tin tài khoản vẫn hiển thị bình thường. Hãy thử tải lại sau khi server đồng bộ DB."
                    />
                )}

                <Card variant="outlined" className="dp-panel dp-profile-hero">
                    <UserInfo user={user} onOpenEdit={() => setIsEditModalOpen(true)} />
                </Card>

                <Row gutter={[16, 16]} className="dp-profile-stats">
                    <Col xs={24} md={8}>
                        <Card variant="outlined" className="dp-panel dp-profile-stat-card">
                            <Statistic title="Tổng đơn hàng" value={orders.length} prefix={<ShoppingOutlined />} />
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card variant="outlined" className="dp-panel dp-profile-stat-card">
                            <Statistic
                                title="Đơn đã xử lý"
                                value={handledOrders.length}
                                prefix={<CheckCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card variant="outlined" className="dp-panel dp-profile-stat-card">
                            <Statistic
                                title="Đã mua"
                                value={totalSpent}
                                prefix={<WalletOutlined />}
                                suffix="đ"
                                formatter={(value) => Number(value || 0).toLocaleString("vi-VN")}
                            />
                        </Card>
                    </Col>
                </Row>

                <Card variant="outlined" className="dp-panel dp-profile-tabs-panel">
                    <Tabs defaultActiveKey="transactions" size="large" items={tabItems} className="dp-profile-tabs" />
                </Card>
            </div>

            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={user}
                onSuccess={fetchData}
            />
        </div>
    );
}
