"use client";

import { useEffect, useMemo, useState } from "react";
import { Layout, Menu, Button, Badge, Avatar, Dropdown, Drawer, Grid, Space } from "antd";
import {
    ShoppingCartOutlined,
    UserOutlined,
    LogoutOutlined,
    LoginOutlined,
    TeamOutlined,
    AppstoreOutlined,
    ReadOutlined,
    CustomerServiceOutlined,
    MenuOutlined,
    HomeOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import api from "@/utils/axios";

const { Header } = Layout;
const { useBreakpoint } = Grid;

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [authState, setAuthState] = useState({
        isAuth: false,
        userName: "",
        userRole: "",
        avatarUrl: "",
    });
    const [cartCount, setCartCount] = useState(0);

    const loadUserData = () => {
        const token = localStorage.getItem("token");
        const name = localStorage.getItem("userName");
        const role = localStorage.getItem("userRole");
        const avatar = localStorage.getItem("avatarUrl");
        const cart = JSON.parse(localStorage.getItem("cart")) || [];

        setAuthState({
            isAuth: !!token,
            userName: name || "",
            userRole: role || "",
            avatarUrl: avatar || "",
        });
        setCartCount(cart.reduce((total, item) => total + Number(item.quantity || 0), 0));
    };

    useEffect(() => {
        loadUserData();
        window.addEventListener("storage", loadUserData);
        window.addEventListener("cart-updated", loadUserData);
        return () => {
            window.removeEventListener("storage", loadUserData);
            window.removeEventListener("cart-updated", loadUserData);
        };
    }, [pathname]);

    const goTo = (href) => {
        setDrawerOpen(false);
        router.push(href);
    };

    const handleLogout = async () => {
        try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) await api.post("/auth/logout", { refreshToken });
        } catch (error) {
            console.log("Lỗi đăng xuất", error);
        } finally {
            localStorage.clear();
            setAuthState({ isAuth: false, userName: "", userRole: "", avatarUrl: "" });
            window.dispatchEvent(new Event("cart-updated"));
            goTo("/login");
        }
    };

    const navItems = useMemo(
        () => [
            { key: "/", icon: <HomeOutlined />, label: "Trang chủ" },
            { key: "/products", icon: <AppstoreOutlined />, label: "Sản phẩm" },
            { key: "/blogs", icon: <ReadOutlined />, label: "Bài viết" },
            { key: "/support", icon: <CustomerServiceOutlined />, label: "Hỗ trợ" },
        ],
        [],
    );

    const selectedKey =
        navItems.find((item) => (item.key === "/" ? pathname === "/" : pathname.startsWith(item.key)))
            ?.key || "";

    const userMenu = [
        {
            key: "profile",
            icon: <UserOutlined />,
            label: "Hồ sơ cá nhân",
            onClick: () => goTo("/profile"),
        },
        (authState.userRole === "admin" || authState.userRole === "root") && {
            key: "admin",
            icon: <TeamOutlined />,
            label: "Trang quản trị",
            onClick: () => goTo("/admin/dashboard"),
        },
        { type: "divider" },
        {
            key: "logout",
            danger: true,
            icon: <LogoutOutlined />,
            label: "Đăng xuất",
            onClick: handleLogout,
        },
    ].filter(Boolean);

    const brand = (
        <button
            type="button"
            onClick={() => goTo("/")}
            style={{
                border: 0,
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 0,
            }}
        >
            <span
                style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    background: "var(--dp-primary)",
                    color: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    letterSpacing: 0,
                }}
            >
                DP
            </span>
            <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
                <span style={{ color: "var(--dp-ink)", fontSize: 20, fontWeight: 900 }}>
                    DPWOOD
                </span>
                <span style={{ color: "var(--dp-muted)", fontSize: 11, fontWeight: 600 }}>
                    Nội thất gỗ chọn lọc
                </span>
            </span>
        </button>
    );

    const rightActions = (
        <Space size={16} align="center">
            <Badge count={cartCount} size="small" offset={[2, 2]}>
                <Button
                    type="text"
                    aria-label="Giỏ hàng"
                    icon={<ShoppingCartOutlined style={{ fontSize: 22 }} />}
                    onClick={() => goTo("/cart")}
                    style={{ width: 40, height: 40 }}
                />
            </Badge>

            {authState.isAuth ? (
                <Dropdown menu={{ items: userMenu }} placement="bottomRight" arrow>
                    <button
                        type="button"
                        style={{
                            border: 0,
                            background: "transparent",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            maxWidth: isMobile ? 44 : 190,
                        }}
                    >
                        <Avatar
                            style={{ backgroundColor: "var(--dp-primary)", flexShrink: 0 }}
                            icon={!authState.avatarUrl ? <UserOutlined /> : null}
                            {...(authState.avatarUrl ? { src: authState.avatarUrl } : {})}
                        />
                        {!isMobile && (
                            <span
                                style={{
                                    fontWeight: 700,
                                    color: "var(--dp-ink)",
                                    overflow: "hidden",
                                    whiteSpace: "nowrap",
                                    textOverflow: "ellipsis",
                                }}
                                title={authState.userName}
                            >
                                {authState.userName || "Tài khoản"}
                            </span>
                        )}
                    </button>
                </Dropdown>
            ) : (
                <Button type="primary" icon={<LoginOutlined />} onClick={() => goTo("/login")}>
                    Đăng nhập
                </Button>
            )}
        </Space>
    );

    return (
        <Header
            style={{
                height: 72,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255, 255, 255, 0.96)",
                backdropFilter: "blur(12px)",
                padding: "0 20px",
                position: "sticky",
                top: 0,
                zIndex: 1000,
                borderBottom: "1px solid var(--dp-soft-border)",
            }}
        >
            <div
                className="dp-container"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 18,
                }}
            >
                {brand}

                {!isMobile && (
                    <Menu
                        theme="light"
                        mode="horizontal"
                        selectedKeys={[selectedKey]}
                        items={navItems}
                        style={{
                            flex: 1,
                            justifyContent: "center",
                            borderBottom: "none",
                            fontWeight: 700,
                            minWidth: 0,
                            background: "transparent",
                        }}
                        onClick={(e) => goTo(e.key)}
                    />
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {rightActions}
                    {isMobile && (
                        <Button
                            aria-label="Mở menu"
                            icon={<MenuOutlined />}
                            onClick={() => setDrawerOpen(true)}
                        />
                    )}
                </div>
            </div>

            <Drawer
                title={brand}
                placement="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                size={310}
            >
                <Menu
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={navItems}
                    onClick={(e) => goTo(e.key)}
                    style={{ borderInlineEnd: 0, fontWeight: 700 }}
                />
            </Drawer>
        </Header>
    );
}
