"use client";

import { useState, useEffect } from "react";
import { Layout, Menu, Button, Dropdown, Avatar, Typography } from "antd";
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    UserOutlined,
    LogoutOutlined,
    DashboardOutlined,
    TeamOutlined,
    AppstoreAddOutlined,
    FileTextOutlined,
    HomeOutlined,
    BellOutlined,
    CustomerServiceOutlined,
    EditOutlined,
    PercentageOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import api from "@/utils/axios";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function AdminLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [adminName, setAdminName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    useEffect(() => {
        setAdminName(localStorage.getItem("userName") || "Admin");
        setAvatarUrl(localStorage.getItem("avatarUrl") || "");
    }, []);

    const handleLogout = async () => {
        try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) await api.post("/auth/logout", { refreshToken });
        } catch (error) {
            console.log("Lỗi đăng xuất", error);
        } finally {
            localStorage.clear();
            router.push("/login");
        }
    };

    const menuItems = [
        { key: "/admin/dashboard", icon: <DashboardOutlined />, label: "Tổng quan" },
        { key: "/admin/users", icon: <TeamOutlined />, label: "Người dùng" },
        { key: "/admin/products", icon: <AppstoreAddOutlined />, label: "Sản phẩm" },
        { key: "/admin/orders", icon: <FileTextOutlined />, label: "Đơn hàng" },
        { key: "/admin/notifications", icon: <BellOutlined />, label: "Thông báo" },
        { key: "/admin/support", icon: <CustomerServiceOutlined />, label: "Hỗ trợ" },
        { key: "/admin/blogs", icon: <EditOutlined />, label: "Bài viết" },
        { key: "/admin/discounts", icon: <PercentageOutlined />, label: "Mã giảm giá" },
        { type: "divider" },
        { key: "/", icon: <HomeOutlined />, label: "Về cửa hàng" },
    ];

    const userMenuItems = [
        {
            key: "profile",
            icon: <UserOutlined />,
            label: "Trang cá nhân",
            onClick: () => router.push("/profile"),
        },
        {
            key: "home",
            icon: <HomeOutlined />,
            label: "Về cửa hàng",
            onClick: () => router.push("/"),
        },
        { type: "divider" },
        {
            key: "logout",
            danger: true,
            icon: <LogoutOutlined />,
            label: "Đăng xuất",
            onClick: handleLogout,
        },
    ];

    const activeKey =
        menuItems.find((item) => item.key && pathname.startsWith(item.key) && item.key !== "/")?.key ||
        "/admin/dashboard";

    return (
        <Layout style={{ minHeight: "100vh", background: "var(--dp-bg)" }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={248}
                style={{
                    background: "#10231e",
                    borderRight: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <button
                    type="button"
                    onClick={() => router.push("/admin/dashboard")}
                    style={{
                        height: 72,
                        width: "100%",
                        border: 0,
                        background: "transparent",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: collapsed ? "center" : "flex-start",
                        gap: 10,
                        padding: collapsed ? 0 : "0 20px",
                        cursor: "pointer",
                    }}
                >
                    <span
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: "var(--dp-primary)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 900,
                        }}
                    >
                        DP
                    </span>
                    {!collapsed && <strong style={{ fontSize: 17 }}>DPWOOD Admin</strong>}
                </button>

                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[activeKey]}
                    items={menuItems}
                    onClick={(item) => router.push(item.key)}
                    style={{
                        background: "transparent",
                        padding: "0 10px",
                        fontWeight: 600,
                    }}
                />
            </Sider>

            <Layout style={{ background: "var(--dp-bg)" }}>
                <Header
                    style={{
                        height: 72,
                        background: "#fff",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0 22px 0 0",
                        borderBottom: "1px solid var(--dp-soft-border)",
                    }}
                >
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ fontSize: 16, width: 64, height: 64 }}
                    />

                    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                        <button
                            type="button"
                            style={{
                                border: 0,
                                background: "transparent",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                            }}
                        >
                            <Avatar
                                style={{ backgroundColor: "var(--dp-primary)", flexShrink: 0 }}
                                icon={!avatarUrl ? <UserOutlined /> : null}
                                {...(avatarUrl ? { src: avatarUrl } : {})}
                            />
                            <Text strong>{adminName}</Text>
                        </button>
                    </Dropdown>
                </Header>

                <Content style={{ padding: 24 }}>
                    <div
                        style={{
                            minHeight: 280,
                            background: "#fff",
                            borderRadius: 8,
                            border: "1px solid var(--dp-soft-border)",
                            padding: 24,
                            boxShadow: "var(--dp-shadow)",
                        }}
                    >
                        {children}
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
}
