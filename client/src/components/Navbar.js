"use client";
import { useEffect, useState } from "react";
import {
    Layout,
    Menu,
    Button,
    Badge,
    Avatar,
    Dropdown,
    Drawer,
    List,
    Tag,
    Typography,
    Empty,
    Popconfirm,
    message,
    Flex,
    Spin,
} from "antd";
import {
    ShoppingCartOutlined,
    UserOutlined,
    LogoutOutlined,
    LoginOutlined,
    TeamOutlined,
    AppstoreOutlined,
    ReadOutlined,
    CustomerServiceOutlined,
    GiftOutlined,
    DeleteOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    StopOutlined,
    PercentageOutlined,
    TagOutlined,
    MenuOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import dayjs from "dayjs";
import useBreakpoint from "antd/lib/grid/hooks/useBreakpoint";
import api from "@/utils/axios";

const { Header } = Layout;
const { Text } = Typography;

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

    // Coupon Drawer
    const [couponDrawerVisible, setCouponDrawerVisible] = useState(false);
    const [myCoupons, setMyCoupons] = useState([]);
    const [couponLoading, setCouponLoading] = useState(false);

    // Mobile Menu Drawer
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const screens = useBreakpoint();
    const isMobile = screens.xs || screens.sm && !screens.md;

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

    const fetchMyCoupons = async () => {
        try {
            setCouponLoading(true);
            const res = await api.get("/coupons/my");
            setMyCoupons(res.data);
        } catch (error) {
            console.error("Lỗi tải mã giảm giá:", error);
        } finally {
            setCouponLoading(false);
        }
    };

    const handleOpenCouponDrawer = () => {
        setCouponDrawerVisible(true);
        fetchMyCoupons();
    };

    const handleDeleteCoupon = async (userCouponId) => {
        try {
            await api.delete(`/coupons/my/${userCouponId}`);
            message.success("Đã xóa mã giảm giá khỏi ví");
            fetchMyCoupons();
        } catch (error) {
            message.error("Lỗi khi xóa mã giảm giá");
        }
    };

    const getCouponStatus = (userCoupon) => {
        const coupon = userCoupon.Coupon;
        if (!coupon) return { status: "invalid", label: "Không khả dụng", color: "default" };

        if (userCoupon.isUsed) return { status: "used", label: "Đã sử dụng", color: "default" };

        const now = new Date();
        const expiry = new Date(coupon.expiryDate);
        if (expiry <= now) return { status: "expired", label: "Hết hạn", color: "red" };
        if (!coupon.isActive)
            return { status: "inactive", label: "Không khả dụng", color: "default" };
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
            return { status: "limited", label: "Hết lượt", color: "orange" };

        return { status: "available", label: "Có thể dùng", color: "green" };
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
        <>
            <Header
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#ffffff",
                    padding: isMobile ? "0 20px" : "0 50px",
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    zIndex: 1000,
                    borderBottom: "1px solid #f0f0f0",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                }}
            >
                {isMobile && (
                    <Button
                        type="text"
                        icon={<MenuOutlined style={{ fontSize: 20 }} />}
                        onClick={() => setMobileMenuOpen(true)}
                        style={{ marginRight: 12 }}
                    />
                )}

                <div
                    style={{
                        color: "#1890ff",
                        fontSize: isMobile ? 20 : 24,
                        fontWeight: "bold",
                        cursor: "pointer",
                        marginRight: isMobile ? "auto" : 40,
                        letterSpacing: 1,
                    }}
                    onClick={() => router.push("/")}
                >
                    DPWOOD
                </div>

                {!isMobile && (
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
                            minWidth: 0,
                        }}
                        onClick={(e) => router.push(e.key)}
                    />
                )}

                <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "12px" : "24px", marginLeft: isMobile ? 0 : 40 }}>
                    {/* Nút Mã giảm giá */}
                    {authState.isAuth && (
                        <GiftOutlined
                            style={{
                                fontSize: "22px",
                                cursor: "pointer",
                                color: "#f5222d",
                            }}
                            onClick={handleOpenCouponDrawer}
                        />
                    )}

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
                                        maxWidth: isMobile ? "90px" : "200px",
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
                            size={isMobile ? "middle" : "middle"}
                        >
                            {!isMobile && "Đăng Nhập"}
                        </Button>
                    )}
                </div>
            </Header>

            {/* Mobile Menu Drawer */}
            <Drawer
                title="Menu"
                placement="left"
                onClose={() => setMobileMenuOpen(false)}
                open={mobileMenuOpen}
                width={280}
                styles={{ body: { padding: 0 } }}
            >
                <Menu
                    mode="inline"
                    selectedKeys={[pathname]}
                    items={navItems}
                    onClick={(e) => {
                        router.push(e.key);
                        setMobileMenuOpen(false);
                    }}
                    style={{ borderRight: "none" }}
                />
            </Drawer>

            {/* Drawer Ví mã giảm giá */}
            <Drawer
                title={
                    <Flex align="center" gap="small">
                        <GiftOutlined style={{ color: "#f5222d", fontSize: 20 }} />
                        <span style={{ fontSize: 16, fontWeight: 600 }}>Mã giảm giá của tôi</span>
                    </Flex>
                }
                placement="right"
                onClose={() => setCouponDrawerVisible(false)}
                open={couponDrawerVisible}
                width={400}
            >
                {couponLoading ? (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <Spin size="large" />
                    </div>
                ) : myCoupons.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Bạn chưa có mã giảm giá nào"
                    />
                ) : (
                    <List
                        dataSource={myCoupons}
                        renderItem={(userCoupon) => {
                            const coupon = userCoupon.Coupon;
                            if (!coupon) return null;

                            const statusInfo = getCouponStatus(userCoupon);
                            const isUnusable = statusInfo.status !== "available";

                            return (
                                <div
                                    key={userCoupon.id}
                                    style={{
                                        padding: "12px 16px",
                                        marginBottom: 12,
                                        borderRadius: 10,
                                        border: isUnusable
                                            ? "1px solid #f0f0f0"
                                            : "1px solid #d9f7be",
                                        background: isUnusable
                                            ? "#fafafa"
                                            : "linear-gradient(135deg, #f6ffed 0%, #fff 100%)",
                                        opacity: isUnusable ? 0.7 : 1,
                                        position: "relative",
                                    }}
                                >
                                    <Flex justify="space-between" align="flex-start">
                                        <div style={{ flex: 1 }}>
                                            <Flex
                                                align="center"
                                                gap="small"
                                                style={{ marginBottom: 6 }}
                                            >
                                                <Text
                                                    strong
                                                    style={{
                                                        fontFamily: "monospace",
                                                        fontSize: 15,
                                                        color: isUnusable
                                                            ? "#8c8c8c"
                                                            : "#1677ff",
                                                        letterSpacing: 1,
                                                    }}
                                                >
                                                    {coupon.code}
                                                </Text>
                                                <Tag
                                                    color={statusInfo.color}
                                                    style={{
                                                        borderRadius: 6,
                                                        fontSize: 11,
                                                    }}
                                                    icon={
                                                        statusInfo.status === "available" ? (
                                                            <CheckCircleOutlined />
                                                        ) : statusInfo.status === "expired" ? (
                                                            <ClockCircleOutlined />
                                                        ) : (
                                                            <StopOutlined />
                                                        )
                                                    }
                                                >
                                                    {statusInfo.label}
                                                </Tag>
                                            </Flex>

                                            <Tag
                                                color={
                                                    coupon.discountType === "percent"
                                                        ? "#f5222d"
                                                        : "#fa8c16"
                                                }
                                                style={{
                                                    borderRadius: 4,
                                                    border: "none",
                                                    fontWeight: 600,
                                                    marginBottom: 4,
                                                }}
                                            >
                                                {coupon.discountType === "percent" ? (
                                                    <>
                                                        <PercentageOutlined /> Giảm{" "}
                                                        {Number(coupon.discountValue)}%
                                                    </>
                                                ) : (
                                                    <>
                                                        <TagOutlined /> Giảm{" "}
                                                        {new Intl.NumberFormat("vi-VN").format(
                                                            coupon.discountValue,
                                                        )}
                                                        ₫
                                                    </>
                                                )}
                                            </Tag>

                                            <div style={{ marginTop: 4 }}>
                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        color: "#8c8c8c",
                                                    }}
                                                >
                                                    {coupon.description ||
                                                        "Áp dụng cho đơn hàng"}
                                                </Text>
                                            </div>

                                            <Flex gap="middle" style={{ marginTop: 4 }}>
                                                {Number(coupon.minOrderAmount) > 0 && (
                                                    <Text
                                                        style={{
                                                            fontSize: 11,
                                                            color: "#bfbfbf",
                                                        }}
                                                    >
                                                        Đơn tối thiểu:{" "}
                                                        {new Intl.NumberFormat("vi-VN").format(
                                                            coupon.minOrderAmount,
                                                        )}
                                                        ₫
                                                    </Text>
                                                )}
                                                <Text
                                                    style={{
                                                        fontSize: 11,
                                                        color: "#bfbfbf",
                                                    }}
                                                >
                                                    HSD:{" "}
                                                    {dayjs(coupon.expiryDate).format(
                                                        "DD/MM/YYYY",
                                                    )}
                                                </Text>
                                            </Flex>
                                        </div>

                                        {isUnusable && (
                                            <Popconfirm
                                                title="Xóa mã này khỏi ví?"
                                                onConfirm={() =>
                                                    handleDeleteCoupon(userCoupon.id)
                                                }
                                                okText="Xóa"
                                                cancelText="Hủy"
                                            >
                                                <Button
                                                    type="text"
                                                    danger
                                                    size="small"
                                                    icon={<DeleteOutlined />}
                                                    style={{ marginLeft: 8 }}
                                                />
                                            </Popconfirm>
                                        )}
                                    </Flex>
                                </div>
                            );
                        }}
                    />
                )}
            </Drawer>
        </>
    );
}
