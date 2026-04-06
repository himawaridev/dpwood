"use client";
import { useEffect, useState } from "react";
import { Layout, Button, Typography, Result, Spin, Card, Dropdown, Avatar, Menu } from "antd";
import {
    UserOutlined,
    LogoutOutlined,
    LoginOutlined,
    UserAddOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import { io } from "socket.io-client";
import AppNavigation from "@/components/AppNavigation";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

// --- Sub-components ---

const LoadingSpinner = () => (
    <div
        style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            background: "#f0f2f5", // Màu nền nhẹ nhàng, tăng UX
        }}
    >
        <Spin size="large" description="Đang tải dữ liệu..." />
    </div>
);

const AppHeader = ({ authState, onLogout }) => {
    const router = useRouter();

    const loggedInMenu = [
        { key: "profile", icon: <UserOutlined />, label: "Hồ sơ cá nhân" },
        (authState.userRole === "admin" || authState.userRole === "root") && {
            key: "admin",
            icon: <TeamOutlined />,
            label: "Quản trị viên",
            onClick: () => router.push("/admin/users"),
        },
        { type: "divider" },
        {
            key: "logout",
            danger: true,
            icon: <LogoutOutlined />,
            label: "Đăng xuất",
            onClick: onLogout,
        },
    ].filter(Boolean);

    const loggedOutMenu = [
        {
            key: "login",
            icon: <LoginOutlined />,
            label: "Đăng nhập",
            onClick: () => router.push("/login"),
        },
        {
            key: "register",
            icon: <UserAddOutlined />,
            label: "Đăng ký",
            onClick: () => router.push("/register"),
        },
    ];

    return (
        <Header
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#001529",
                padding: "0 40px",
                position: "sticky", // Giữ header cố định khi cuộn
                top: 0,
                zIndex: 1,
                width: "100%",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            }}
        >
            {/* Logo */}
            <div
                style={{
                    color: "#fff",
                    fontSize: 22,
                    fontWeight: "bold",
                    cursor: "pointer",
                    marginRight: 24,
                    letterSpacing: 1,
                }}
                onClick={() => router.push("/")}
            >
                DPWOOD
            </div>

            {/* Navigation */}
            <AppNavigation />

            {/* User Dropdown */}
            <Dropdown
                menu={{ items: authState.isAuth ? loggedInMenu : loggedOutMenu }}
                placement="bottomRight"
                arrow={{ pointAtCenter: true }}
                trigger={["click"]}
            >
                <div
                    style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        color: "white",
                        padding: "0 12px",
                        transition: "background 0.3s",
                        borderRadius: 6,
                    }}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                    <Avatar
                        style={{
                            backgroundColor: authState.isAuth ? "#1677ff" : "#8c8c8c",
                            marginRight: 8,
                        }}
                        icon={<UserOutlined />}
                        alt={authState.userName || "Guest"}
                    />
                    <span style={{ fontWeight: 500 }}>
                        {authState.isAuth ? authState.userName : "Tài khoản"}
                    </span>
                </div>
            </Dropdown>
        </Header>
    );
};

const AppContent = ({ authState }) => {
    const router = useRouter();

    return (
        <Content
            style={{
                padding: "40px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "#f0f2f5", // Nền nhạt để làm nổi bật các Card
            }}
        >
            <div style={{ width: "100%", maxWidth: 1200 }}>
                {!authState.isAuth ? (
                    <Card
                        style={{
                            borderRadius: 16,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                            border: "none",
                        }}
                    >
                        <Result
                            status="403"
                            title="Bạn chưa đăng nhập"
                            subTitle="Vui lòng đăng nhập để sử dụng đầy đủ các tính năng của hệ thống."
                            extra={
                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={() => router.push("/login")}
                                    style={{ borderRadius: 8 }}
                                >
                                    Đăng nhập ngay
                                </Button>
                            }
                        />
                    </Card>
                ) : (
                    <div>
                        <Card
                            style={{
                                borderRadius: 16,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                border: "none",
                            }}
                        >
                            <Title level={2} style={{ marginTop: 0 }}>
                                Khu vực thành viên
                            </Title>
                            <Text style={{ fontSize: 16 }}>
                                Xin chào,{" "}
                                <strong style={{ color: "#1677ff", fontSize: 18 }}>
                                    {authState.userName}
                                </strong>
                                ! Chúc bạn một ngày làm việc hiệu quả.
                            </Text>
                        </Card>
                        <Card
                            style={{
                                borderRadius: 16,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                border: "none",
                            }}
                        >
                            <Title level={2} style={{ marginTop: 0 }}>
                                Khu vực thành viên
                            </Title>
                            <Text style={{ fontSize: 16 }}>
                                Xin chào,{" "}
                                <strong style={{ color: "#1677ff", fontSize: 18 }}>
                                    {authState.userName}
                                </strong>
                                ! Chúc bạn một ngày làm việc hiệu quả.
                            </Text>
                        </Card>
                    </div>
                )}
            </div>
        </Content>
    );
};

const AppFooter = () => (
    <Footer
        style={{
            textAlign: "center",
            background: "#001529",
            color: "rgba(255, 255, 255, 0.65)",
        }}
    >
        DPWOOD ©{new Date().getFullYear()} - Hệ thống quản lý và cung cấp giải pháp
    </Footer>
);

// --- Main Page Component ---

export default function HomePage() {
    const [authState, setAuthState] = useState({
        isAuth: false,
        loading: true,
        userName: "",
        userRole: "",
    });

    const router = useRouter();

    useEffect(() => {
        // Fix warning SSR của Next.js bằng cách check window an toàn cho mọi biến localStorage
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const name = typeof window !== "undefined" ? localStorage.getItem("userName") : "";
        const role = typeof window !== "undefined" ? localStorage.getItem("userRole") : "";
        const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : "";

        setAuthState({
            isAuth: !!token,
            loading: false,
            userName: name || "Người dùng",
            userRole: role || "",
        });

        if (!token) return;

        const socket = io("http://localhost:5000");

        socket.on("connect", () => {
            if (userId) socket.emit("register_user", userId);
        });

        socket.on("force_logout", () => {
            localStorage.clear();
            socket.disconnect();
            window.location.href = "/banned";
        });

        return () => {
            if (socket) socket.disconnect();
        };
    }, []);

    const handleLogout = async () => {
        try {
            const refreshToken = localStorage.getItem("refreshToken");
            const token = localStorage.getItem("token");

            if (token && refreshToken) {
                await api.post("/auth/logout", { refreshToken });
            }
        } catch (error) {
            console.error("Lỗi logout:", error.response?.data || error.message);
        } finally {
            localStorage.clear();
            setAuthState({ isAuth: false, loading: false, userName: "", userRole: "" });
            router.push("/login");
        }
    };

    if (authState.loading) {
        return <LoadingSpinner />;
    }

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <AppHeader authState={authState} onLogout={handleLogout} />
            <AppContent authState={authState} />
            <AppFooter />
        </Layout>
    );
}
