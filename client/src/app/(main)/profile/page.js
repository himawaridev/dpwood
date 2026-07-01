"use client";

import React, { useCallback, useEffect, useState } from "react";
import { App, Card, Tabs, Spin, Typography } from "antd";
import { ShoppingOutlined, HistoryOutlined } from "@ant-design/icons";
import api from "@/utils/axios";
import { useRouter } from "next/navigation";
import UserInfo from "./components/UserInfo";
import EditProfileModal from "./components/EditProfileModal";
import MyOrders from "./components/MyOrders";
import TransactionHistory from "./components/TransactionHistory";

const { Title, Text } = Typography;

export default function UserProfilePage() {
    const { message } = App.useApp();
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const router = useRouter();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [userRes, ordersRes, logsRes] = await Promise.all([
                api.get("/users/me"),
                api.get("/orders/me"),
                api.get("/users/logs?me=true").catch(() => ({ data: [] })),
            ]);

            setUser(userRes.data);
            setOrders(ordersRes.data);
            setLogs(logsRes.data || []);
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

    const tabItems = [
        {
            key: "orders",
            label: (
                <span>
                    <ShoppingOutlined /> Đơn hàng của tôi
                </span>
            ),
            children: <MyOrders orders={orders} onRefresh={fetchData} />,
        },
        {
            key: "transactions",
            label: (
                <span>
                    <HistoryOutlined /> Lịch sử hoạt động
                </span>
            ),
            children: <TransactionHistory logs={logs} />,
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
        <div className="dp-page">
            <div className="dp-container">
                <div style={{ marginBottom: 22 }}>
                    <span className="dp-eyebrow">Tài khoản</span>
                    <Title level={1} className="dp-section-title">
                        Hồ sơ cá nhân
                    </Title>
                    <Text className="dp-muted">Quản lý thông tin, đơn hàng và hoạt động tài khoản.</Text>
                </div>

                <Card variant="outlined" className="dp-panel" style={{ marginBottom: 22 }}>
                    <UserInfo user={user} onOpenEdit={() => setIsEditModalOpen(true)} />
                </Card>

                <Card variant="outlined" className="dp-panel">
                    <Tabs defaultActiveKey="orders" size="large" items={tabItems} />
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
