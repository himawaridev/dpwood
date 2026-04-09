"use client";
import React, { useEffect, useState } from "react";
import { Card, Tabs, Spin, message } from "antd";
import { ShoppingOutlined, HistoryOutlined } from "@ant-design/icons";
import api from "@/utils/axios";
import { useRouter } from "next/navigation";

// Nhúng các component con đã chia nhỏ
import UserInfo from "./components/UserInfo";
import EditProfileModal from "./components/EditProfileModal";
import MyOrders from "./components/MyOrders";
import TransactionHistory from "./components/TransactionHistory";

export default function UserProfilePage() {
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const router = useRouter();

    const fetchData = async () => {
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
                message.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!");
                localStorage.clear();
                router.push("/login");
            } else {
                message.error("Không thể tải dữ liệu cá nhân.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("status") === "PAID" || params.get("cancel") === "false") {
            message.success("🎉 Thanh toán thành công! Hệ thống đã ghi nhận đơn hàng.");
            window.history.replaceState(null, "", "/profile");
        }
        fetchData();
    }, []);

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
            <div
                style={{
                    height: "80vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Spin size="large" description="Đang tải dữ liệu hồ sơ..." />
            </div>
        );
    }

    return (
        <div style={{ padding: "30px 50px", minHeight: "100vh", background: "#f0f2f5" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                {/* Component 1: Cụm thông tin người dùng */}
                <Card
                    variant="borderless"
                    style={{
                        marginBottom: 24,
                        borderRadius: "12px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                    }}
                >
                    <UserInfo user={user} onOpenEdit={() => setIsEditModalOpen(true)} />
                </Card>

                {/* Component 2 & 3: Tabs chứa Bảng Đơn Hàng và Bảng Lịch Sử */}
                <Card
                    variant="borderless"
                    style={{ borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
                >
                    <Tabs defaultActiveKey="orders" size="large" items={tabItems} />
                </Card>
            </div>

            {/* Component 4: Modal Cài đặt hồ sơ */}
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={user}
                onSuccess={fetchData}
            />
        </div>
    );
}
