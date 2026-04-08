"use client";
import { useEffect, useState } from "react";
import { Layout, Menu, Button, Badge, Avatar, Dropdown } from "antd";
import {
    ShoppingCartOutlined,
    UserOutlined,
    LogoutOutlined,
    LoginOutlined,
    TeamOutlined,
    AppstoreOutlined,
    ReadOutlined,
    CustomerServiceOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import api from "@/utils/axios";

const { Header } = Layout;

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();

    const [authState, setAuthState] = useState({
        isAuth: false,
        userName: "",
        userRole: "",
        avatarUrl: "", // Thêm state để lưu link ảnh đại diện
    });
    const [cartCount, setCartCount] = useState(0);

    // Hàm load dữ liệu (có thể được gọi lại khi có event)
    const loadUserData = () => {
        const token = localStorage.getItem("token");
        const name = localStorage.getItem("userName");
        const role = localStorage.getItem("userRole");
        const avatar = localStorage.getItem("avatarUrl"); // Lấy ảnh từ LocalStorage

        setAuthState({
            isAuth: !!token,
            userName: name || "",
            userRole: role || "",
            avatarUrl: avatar || "",
        });

        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        setCartCount(cart.reduce((total, item) => total + item.quantity, 0));
    };

    useEffect(() => {
        loadUserData();

        // Lắng nghe sự kiện "storage" để cập nhật ngay lập tức khi đổi tên/ảnh ở trang Profile
        window.addEventListener("storage", loadUserData);
        return () => window.removeEventListener("storage", loadUserData);
    }, [pathname]);

    const handleLogout = async () => {
        try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) await api.post("/auth/logout", { refreshToken });
        } catch (error) {
            console.log("Lỗi đăng xuất", error);
        } finally {
            localStorage.clear();
            setAuthState({ isAuth: false, userName: "", userRole: "", avatarUrl: "" });
            router.push("/login");
        }
    };

    const navItems = [
        { key: "/products", icon: <AppstoreOutlined />, label: "Sản phẩm" },
        { key: "/blogs", icon: <ReadOutlined />, label: "Blogs" },
        { key: "/support", icon: <CustomerServiceOutlined />, label: "Hỗ trợ" },
    ];

    const userMenu = [
        {
            key: "profile",
            icon: <UserOutlined />,
            label: "Hồ sơ cá nhân",
            onClick: () => router.push("/profile"),
        },
        (authState.userRole === "admin" || authState.userRole === "root") && {
            key: "admin",
            icon: <TeamOutlined />,
            label: "Trang Quản trị",
            onClick: () => router.push("/admin/dashboard"),
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

    return (
        <Header
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#ffffff",
                padding: "0 50px",
                position: "sticky",
                top: 0,
                zIndex: 1000,
                borderBottom: "1px solid #f0f0f0",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            }}
        >
            <div
                style={{
                    color: "#1890ff",
                    fontSize: 24,
                    fontWeight: "bold",
                    cursor: "pointer",
                    marginRight: 40,
                    letterSpacing: 1,
                }}
                onClick={() => router.push("/")}
            >
                DPWOOD
            </div>

            <Menu
                theme="light"
                mode="horizontal"
                selectedKeys={[pathname]}
                items={navItems}
                style={{
                    flex: 1,
                    borderBottom: "none",
                    justifyContent: "center",
                    fontWeight: 500,
                }}
                onClick={(e) => router.push(e.key)}
            />

            <div style={{ display: "flex", alignItems: "center", gap: "24px", marginLeft: 40 }}>
                <Badge count={cartCount} size="small" offset={[5, 0]}>
                    <ShoppingCartOutlined
                        style={{
                            fontSize: "22px",
                            cursor: "pointer",
                            color: "#000000",
                        }}
                        onClick={() => router.push("/cart")}
                    />
                </Badge>

                {authState.isAuth ? (
                    <Dropdown menu={{ items: userMenu }} placement="bottomRight" arrow>
                        <div
                            style={{
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                color: "#000000",
                            }}
                        >
                            <Avatar
                                style={{ backgroundColor: "#1890ff", flexShrink: 0 }}
                                icon={!authState.avatarUrl ? <UserOutlined /> : null}
                                {...(authState.avatarUrl ? { src: authState.avatarUrl } : {})}
                            />

                            <span
                                style={{
                                    fontWeight: 500,
                                    maxWidth: "200px",
                                    overflow: "hidden",
                                    whiteSpace: "nowrap",
                                    textOverflow: "ellipsis",
                                    display: "inline-block",
                                    verticalAlign: "bottom",
                                }}
                                title={authState.userName}
                            >
                                {authState.userName}
                            </span>
                        </div>
                    </Dropdown>
                ) : (
                    <Button
                        type="primary"
                        icon={<LoginOutlined />}
                        onClick={() => router.push("/login")}
                        style={{ borderRadius: "6px" }}
                    >
                        Đăng Nhập
                    </Button>
                )}
            </div>
        </Header>
    );
}
