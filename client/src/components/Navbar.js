/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Layout, Menu, Button, Badge, Avatar, Dropdown, Drawer, Grid } from "antd";
import {
    ShoppingCartOutlined,
    GiftOutlined,
    UserOutlined,
    LogoutOutlined,
    LoginOutlined,
    TeamOutlined,
    MenuOutlined,
    SearchOutlined,
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
            { key: "/", label: "Home" },
            { key: "/products", label: "Products" },
            { key: "/blogs", label: "Blog" },
            { key: "/support", label: "Contact Us" },
        ],
        [],
    );

    const selectedKey =
        navItems.find((item) => {
            const baseKey = item.key.split("?")[0];
            return item.key === "/" ? pathname === "/" : pathname.startsWith(baseKey);
        })?.key || "";

    const userMenu = [
        {
            key: "profile",
            icon: <UserOutlined />,
            label: "Profile",
            onClick: () => goTo("/profile"),
        },
        (authState.userRole === "admin" || authState.userRole === "root") && {
            key: "admin",
            icon: <TeamOutlined />,
            label: "Admin",
            onClick: () => goTo("/admin/dashboard"),
        },
        { type: "divider" },
        {
            key: "logout",
            danger: true,
            icon: <LogoutOutlined />,
            label: "Log out",
            onClick: handleLogout,
        },
    ].filter(Boolean);

    const brand = (
        <button type="button" onClick={() => goTo("/")} className="webcake-brand">
            <img src="/logo.png" alt="DPWOOD Store" className="webcake-brand-logo" />
            <span className="webcake-brand-text">DPWOOD</span>
        </button>
    );

    const accountButton = authState.isAuth ? (
        <Dropdown menu={{ items: userMenu }} placement="bottomRight" arrow>
            <button type="button" className="webcake-account-button" aria-label="Account">
                <Avatar
                    className="webcake-avatar"
                    icon={!authState.avatarUrl ? <UserOutlined /> : null}
                    {...(authState.avatarUrl ? { src: authState.avatarUrl } : {})}
                />
                {!isMobile && <span className="webcake-account-name">{authState.userName || "Account"}</span>}
            </button>
        </Dropdown>
    ) : (
        <Button type="text" icon={<LoginOutlined />} onClick={() => goTo("/login")} className="webcake-login-button">
            Login
        </Button>
    );

    const rightActions = (
        <div className="webcake-nav-actions">
            <div className="webcake-utility-group">
                <Button
                    type="text"
                    aria-label="Search"
                    className="webcake-icon-button"
                    icon={<SearchOutlined />}
                    onClick={() => goTo("/products")}
                />
                <Button
                    type="text"
                    aria-label="Coupons"
                    className="webcake-icon-button"
                    icon={<GiftOutlined />}
                    onClick={() => goTo("/#special-offers")}
                />
                <Badge count={cartCount} size="small" offset={[1, 1]}>
                    <Button
                        type="text"
                        aria-label="Cart"
                        className="webcake-icon-button"
                        icon={<ShoppingCartOutlined />}
                        onClick={() => goTo("/cart")}
                    />
                </Badge>
            </div>
            <div className="webcake-account-slot">{accountButton}</div>
            {isMobile && (
                <Button
                    type="text"
                    aria-label="Open menu"
                    className="webcake-icon-button"
                    icon={<MenuOutlined />}
                    onClick={() => setDrawerOpen(true)}
                />
            )}
        </div>
    );

    return (
        <Header className="webcake-navbar">
            <div className="webcake-nav-container">
                {brand}

                {!isMobile && (
                    <Menu
                        theme="light"
                        mode="horizontal"
                        selectedKeys={[selectedKey]}
                        items={navItems}
                        className="webcake-nav-menu"
                        onClick={(e) => goTo(e.key)}
                    />
                )}

                <div className="webcake-nav-right">
                    {rightActions}
                </div>
            </div>

            <Drawer title={brand} placement="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} size={310}>
                <Menu
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={navItems}
                    onClick={(e) => goTo(e.key)}
                    style={{ borderInlineEnd: 0, fontWeight: 600 }}
                />
            </Drawer>
        </Header>
    );
}
