"use client";
import { useState, useEffect } from "react";
import { Layout, Menu, Button, Dropdown, Avatar, theme } from "antd";
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
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import api from "@/utils/axios";

const { Header, Sider, Content } = Layout;

export default function AdminLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [adminName, setAdminName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState(""); // 🔴 Thêm state lưu avatar

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    useEffect(() => {
        const name = typeof window !== "undefined" ? localStorage.getItem("userName") : "Admin";
        const avatar = typeof window !== "undefined" ? localStorage.getItem("avatarUrl") : ""; // 🔴 Lấy avatar từ localStorage
        setAdminName(name);
        setAvatarUrl(avatar || "");
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
        {
            key: "/admin/dashboard",
            icon: <DashboardOutlined />,
            label: "Tổng quan",
            onClick: () => router.push("/admin/dashboard"),
        },
        {
            key: "/admin/users",
            icon: <TeamOutlined />,
            label: "Quản lý Người Dùng",
            onClick: () => router.push("/admin/users"),
        },
        {
            key: "/admin/products",
            icon: <AppstoreAddOutlined />,
            label: "Quản lý Sản Phẩm",
            onClick: () => router.push("/admin/products"),
        },
        {
            key: "/admin/orders",
            icon: <FileTextOutlined />,
            label: "Quản lý Đơn Hàng",
            onClick: () => router.push("/admin/orders"),
        },
        {
            key: "/admin/notifications",
            icon: <BellOutlined />,
            label: "Quản lý Thông Báo",
            onClick: () => router.push("/admin/notifications"),
        },
        {
            key: "/admin/support",
            icon: <CustomerServiceOutlined />,
            label: "Hỗ Trợ Khách Hàng",
            onClick: () => router.push("/admin/support"),
        },
        {
            key: "/admin/blogs",
            icon: <EditOutlined />,
            label: "Quản lý Bài viết",
            onClick: () => router.push("/admin/blogs"),
        },
        { type: "divider" },
        {
            key: "/",
            icon: <HomeOutlined />,
            label: "Về Trang Chủ",
            onClick: () => router.push("/"),
        },
    ];

    // 🔴 Cấu hình Menu cho Dropdown ở Header
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
            label: "Về trang chủ",
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
        menuItems.find((item) => pathname.startsWith(item.key) && item.key !== "/")?.key ||
        "/admin/dashboard";

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Sider trigger={null} collapsible collapsed={collapsed} theme="dark" width={250}>
                <div
                    style={{
                        height: 64,
                        margin: 16,
                        color: "white",
                        fontSize: collapsed ? "12px" : "20px",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                    }}
                >
                    {collapsed ? "DP" : "DPWOOD ADMIN"}
                </div>
                <Menu theme="dark" mode="inline" selectedKeys={[activeKey]} items={menuItems} />
            </Sider>

            <Layout>
                <Header
                    style={{
                        padding: 0,
                        background: colorBgContainer,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingRight: "24px",
                    }}
                >
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ fontSize: "16px", width: 64, height: 64 }}
                    />

                    {/* 🔴 Dropdown đã được cập nhật đầy đủ tính năng */}
                    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                        <div
                            style={{
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <Avatar
                                style={{ backgroundColor: "#f56a00", flexShrink: 0 }}
                                icon={!avatarUrl ? <UserOutlined /> : null}
                                // Tránh lỗi src="" khi chưa có ảnh
                                {...(avatarUrl ? { src: avatarUrl } : {})}
                            />
                            <span style={{ fontWeight: 500 }}>{adminName}</span>
                        </div>
                    </Dropdown>
                </Header>

                <Content
                    style={{
                        margin: "24px 16px",
                        padding: 24,
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}
