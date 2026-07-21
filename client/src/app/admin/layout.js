"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Layout, Menu, Button, Dropdown, Avatar, Typography, Drawer, Grid } from "antd";
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
    RobotOutlined,
    LoginOutlined,
    SafetyCertificateOutlined,
    SolutionOutlined,
    SwapOutlined,
    MailOutlined,
    StarOutlined,
    PictureOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import api from "@/utils/axios";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;
const ADMIN_ROUTE_KEYS = [
    "/admin/dashboard",
    "/admin/users",
    "/admin/products",
    "/admin/reviews",
    "/admin/orders",
    "/admin/notifications",
    "/admin/support",
    "/admin/blogs",
    "/admin/coupons",
    "/admin/newsletter",
    "/admin/banners",
];

export default function AdminLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const screens = useBreakpoint();
    const isMobile = !screens.lg;
    const [collapsed, setCollapsed] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [adminName, setAdminName] = useState("");
    const [adminRole, setAdminRole] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [selectedMenuKey, setSelectedMenuKey] = useState("/admin/dashboard");
    const [openMenuKeys, setOpenMenuKeys] = useState([]);

    useEffect(() => {
        setAdminName(localStorage.getItem("userName") || "Quản trị viên");
        setAvatarUrl(localStorage.getItem("avatarUrl") || "");
        setAdminRole(localStorage.getItem("userRole") || "");
    }, []);

    useEffect(() => {
        if (adminRole !== "staff") return;
        const staffRoutes = ["/admin/orders", "/admin/notifications", "/admin/support"];
        if (!staffRoutes.some((route) => pathname.startsWith(route))) {
            router.replace("/admin/orders");
        }
    }, [adminRole, pathname, router]);

    useEffect(() => {
        if (pathname.startsWith("/admin/ai")) {
            setSelectedMenuKey(pathname === "/admin/ai" ? "/admin/ai/blog" : pathname);
            setOpenMenuKeys(["/admin/ai"]);
            return;
        }

        if (pathname.startsWith("/admin/users")) {
            setSelectedMenuKey(pathname === "/admin/users" ? "/admin/users/roles" : pathname);
            setOpenMenuKeys(["/admin/users"]);
            return;
        }

        setSelectedMenuKey(
            ADMIN_ROUTE_KEYS.find((key) => pathname.startsWith(key)) || "/admin/dashboard",
        );
    }, [pathname]);

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

    const administratorMenuItems = [
        { key: "/admin/dashboard", icon: <DashboardOutlined />, label: "Tổng quan" },
        {
            key: "/admin/users",
            icon: <TeamOutlined />,
            label: "Người dùng",
            children: [
                { key: "/admin/users/roles", icon: <SolutionOutlined />, label: "Phân quyền" },
                { key: "/admin/users/status", icon: <SafetyCertificateOutlined />, label: "Trạng thái" },
                { key: "/admin/users/auth-logs", icon: <LoginOutlined />, label: "Lịch sử đăng nhập" },
                { key: "/admin/users/transactions", icon: <SwapOutlined />, label: "Lịch sử giao dịch" },
            ],
        },
        { key: "/admin/products", icon: <AppstoreAddOutlined />, label: "Sản phẩm" },
        { key: "/admin/banners", icon: <PictureOutlined />, label: "Banner trang chủ" },
        { key: "/admin/reviews", icon: <StarOutlined />, label: "Đánh giá" },
        { key: "/admin/orders", icon: <FileTextOutlined />, label: "Đơn hàng" },
        { key: "/admin/notifications", icon: <BellOutlined />, label: "Thông báo" },
        { key: "/admin/support", icon: <CustomerServiceOutlined />, label: "Hỗ trợ" },
        { key: "/admin/blogs", icon: <EditOutlined />, label: "Bài viết" },
        { key: "/admin/coupons", icon: <PercentageOutlined />, label: "Mã giảm giá" },
        { key: "/admin/newsletter", icon: <MailOutlined />, label: "Bản tin email" },
        {
            key: "/admin/ai",
            icon: <RobotOutlined />,
            label: "Trung tâm AI",
            children: [
                { key: "/admin/ai/blog", label: "Bài viết AI" },
                { key: "/admin/ai/products", label: "Sản phẩm AI" },
                { key: "/admin/ai/support", label: "Hỗ trợ AI" },
                { key: "/admin/ai/rules", label: "Quy tắc AI" },
                { key: "/admin/ai/email", label: "Email AI" },
            ],
        },
    ];
    const staffMenuItems = [
        { key: "/admin/orders", icon: <FileTextOutlined />, label: "Đơn hàng" },
        { key: "/admin/notifications", icon: <BellOutlined />, label: "Thông báo" },
        { key: "/admin/support", icon: <CustomerServiceOutlined />, label: "Hỗ trợ khách hàng" },
    ];
    const menuItems = [
        ...(adminRole === "staff" ? staffMenuItems : administratorMenuItems),
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
        pathname.startsWith("/admin/users")
            ? pathname === "/admin/users"
                ? "/admin/users/roles"
                : pathname
            : pathname.startsWith("/admin/ai")
            ? pathname === "/admin/ai"
                ? "/admin/ai/blog"
                : pathname
            : ADMIN_ROUTE_KEYS.find((key) => pathname.startsWith(key)) || "/admin/dashboard";

    const handleMenuClick = (item) => {
        setSelectedMenuKey(item.key);
        setMobileNavOpen(false);
        router.push(item.key);
    };

    const sidebarContent = (
        <>
            <button
                type="button"
                onClick={() => router.push("/admin/dashboard")}
                className="dp-admin-brand"
                aria-label="Trang quản trị DPWOOD"
            >
                <Image src="/logo.png" alt="DPWOOD" width={38} height={38} className="dp-admin-brand-logo" />
                {(!collapsed || isMobile) && <strong>Quản trị DPWOOD</strong>}
            </button>

            <Menu
                mode="inline"
                selectedKeys={[selectedMenuKey || activeKey]}
                openKeys={openMenuKeys}
                onOpenChange={setOpenMenuKeys}
                items={menuItems}
                onClick={handleMenuClick}
                className="dp-admin-menu"
            />
        </>
    );

    return (
        <Layout className="dp-admin-shell">
            {!isMobile && (
                <Sider
                    trigger={null}
                    collapsible
                    collapsed={collapsed}
                    width={260}
                    className="dp-admin-sider"
                >
                    {sidebarContent}
                </Sider>
            )}

            <Drawer
                open={mobileNavOpen}
                onClose={() => setMobileNavOpen(false)}
                placement="left"
                size={300}
                className="dp-admin-drawer"
                styles={{ body: { padding: 0 } }}
            >
                {sidebarContent}
            </Drawer>

            <Layout className="dp-admin-main">
                <Header className="dp-admin-header">
                    <Button
                        type="text"
                        icon={isMobile || collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => (isMobile ? setMobileNavOpen(true) : setCollapsed(!collapsed))}
                        className="dp-admin-menu-button"
                        aria-label="Toggle admin navigation"
                    />

                    <Dropdown
                        menu={{ items: userMenuItems }}
                        placement="bottomRight"
                        arrow
                        getPopupContainer={() => document.body}
                        classNames={{ root: "dp-admin-user-dropdown" }}
                    >
                        <button type="button" className="dp-admin-account">
                            <Avatar
                                className="dp-admin-avatar"
                                icon={!avatarUrl ? <UserOutlined /> : null}
                                {...(avatarUrl ? { src: avatarUrl } : {})}
                            />
                            <Text strong className="dp-admin-account-name">
                                {adminName}
                            </Text>
                        </button>
                    </Dropdown>
                </Header>

                <Content className="dp-admin-content">
                    <div className="dp-admin-page">{children}</div>
                </Content>
            </Layout>
        </Layout>
    );
}
