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
    HeartFilled,
    HeartOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
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
    const [wishlistCount, setWishlistCount] = useState(0);

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

        if (token) {
            api.get("/products/wishlist/me", { authRequired: true })
                .then((response) => {
                    if (localStorage.getItem("token") === token) {
                        setWishlistCount((response.data || []).length);
                    }
                })
                .catch(() => setWishlistCount(0));
        } else {
            setWishlistCount(0);
        }
    };

    useEffect(() => {
        loadUserData();
        window.addEventListener("storage", loadUserData);
        window.addEventListener("cart-updated", loadUserData);
        window.addEventListener("wishlist-updated", loadUserData);
        return () => {
            window.removeEventListener("storage", loadUserData);
            window.removeEventListener("cart-updated", loadUserData);
            window.removeEventListener("wishlist-updated", loadUserData);
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
            setWishlistCount(0);
            window.dispatchEvent(new Event("cart-updated"));
            goTo("/login");
        }
    };

    const navItems = useMemo(
        () => [
            { key: "/", label: "Trang chủ" },
            { key: "/products", label: "Sản phẩm" },
            { key: "/orders", label: "Đơn hàng" },
            { key: "/returns", label: "Đổi trả hàng" },
            { key: "/blogs", label: "Bài viết" },
            { key: "/support", label: "Liên hệ" },
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
            label: "Hồ sơ cá nhân",
            onClick: () => goTo("/profile"),
        },
        ["admin", "root", "staff"].includes(authState.userRole) && {
            key: "admin",
            icon: <TeamOutlined />,
            label: "Trang quản trị",
            onClick: () => goTo(authState.userRole === "staff" ? "/admin/orders" : "/admin/dashboard"),
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
        <button type="button" onClick={() => goTo("/")} className="webcake-brand">
            <Image src="/logo.png" alt="DPWOOD Store" className="webcake-brand-logo" width={64} height={56} priority />
            <span className="webcake-brand-text">DPWOOD</span>
        </button>
    );

    const accountButton = authState.isAuth ? (
        <Dropdown
            menu={{ items: userMenu }}
            placement="bottomRight"
            arrow
            getPopupContainer={() => document.body}
            classNames={{ root: "webcake-account-dropdown" }}
            styles={{ root: { zIndex: 5000 } }}
        >
            <button type="button" className="webcake-account-button" aria-label="Tài khoản">
                <Avatar
                    className="webcake-avatar"
                    icon={!authState.avatarUrl ? <UserOutlined /> : null}
                    {...(authState.avatarUrl ? { src: authState.avatarUrl } : {})}
                />
                {!isMobile && <span className="webcake-account-name">{authState.userName || "Tài khoản"}</span>}
            </button>
        </Dropdown>
    ) : (
        <Button type="text" icon={<LoginOutlined />} onClick={() => goTo("/login")} className="webcake-login-button">
            Đăng nhập
        </Button>
    );

    const rightActions = (
        <div className="webcake-nav-actions">
            <div className="webcake-utility-group">
                <Button
                    type="text"
                    aria-label="Tìm kiếm"
                    className="webcake-icon-button"
                    icon={<SearchOutlined />}
                    onClick={() => goTo("/products")}
                />
                <Button
                    type="text"
                    aria-label="Mã giảm giá"
                    className="webcake-icon-button"
                    icon={<GiftOutlined />}
                    onClick={() => goTo("/gift-codes")}
                />
                <Badge count={wishlistCount} size="small" offset={[1, 1]}>
                        <Button
                            type="text"
                            aria-label="Sản phẩm yêu thích"
                            className={`webcake-icon-button ${wishlistCount > 0 ? "is-active" : ""}`}
                            icon={wishlistCount > 0 ? <HeartFilled /> : <HeartOutlined />}
                            onClick={() => {
                                if (!authState.isAuth) {
                                    goTo("/login");
                                    return;
                                }
                                window.dispatchEvent(new Event("wishlist-filter-requested"));
                                goTo("/products?wishlist=true");
                            }}
                        />
                </Badge>
                <Badge count={cartCount} size="small" offset={[1, 1]}>
                    <Button
                        type="text"
                        aria-label="Giỏ hàng"
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
                    aria-label="Mở trình đơn"
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
