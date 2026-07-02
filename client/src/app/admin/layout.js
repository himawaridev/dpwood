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
    "/admin/orders",
    "/admin/notifications",
    "/admin/support",
    "/admin/blogs",
    "/admin/coupons",
];

export default function AdminLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const screens = useBreakpoint();
    const isMobile = !screens.lg;
    const [collapsed, setCollapsed] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [adminName, setAdminName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [selectedMenuKey, setSelectedMenuKey] = useState("/admin/dashboard");
    const [openMenuKeys, setOpenMenuKeys] = useState([]);

    useEffect(() => {
        setAdminName(localStorage.getItem("userName") || "Admin");
        setAvatarUrl(localStorage.getItem("avatarUrl") || "");
    }, []);

    useEffect(() => {
        if (pathname.startsWith("/admin/ai")) {
            setSelectedMenuKey(pathname === "/admin/ai" ? "/admin/ai/blog" : pathname);
            setOpenMenuKeys(["/admin/ai"]);
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
            console.log("Loi dang xuat", error);
        } finally {
            localStorage.clear();
            router.push("/login");
        }
    };

    const menuItems = [
        { key: "/admin/dashboard", icon: <DashboardOutlined />, label: "Tong quan" },
        { key: "/admin/users", icon: <TeamOutlined />, label: "Nguoi dung" },
        { key: "/admin/products", icon: <AppstoreAddOutlined />, label: "San pham" },
        { key: "/admin/orders", icon: <FileTextOutlined />, label: "Don hang" },
        { key: "/admin/notifications", icon: <BellOutlined />, label: "Thong bao" },
        { key: "/admin/support", icon: <CustomerServiceOutlined />, label: "Ho tro" },
        { key: "/admin/blogs", icon: <EditOutlined />, label: "Bai viet" },
        { key: "/admin/coupons", icon: <PercentageOutlined />, label: "Ma giam gia" },
        {
            key: "/admin/ai",
            icon: <RobotOutlined />,
            label: "AI Center",
            children: [
                { key: "/admin/ai/blog", label: "Blog AI" },
                { key: "/admin/ai/products", label: "San pham AI" },
                { key: "/admin/ai/support", label: "Ticket AI" },
                { key: "/admin/ai/rules", label: "Quy tac AI" },
            ],
        },
        { type: "divider" },
        { key: "/", icon: <HomeOutlined />, label: "Ve cua hang" },
    ];

    const userMenuItems = [
        {
            key: "profile",
            icon: <UserOutlined />,
            label: "Trang ca nhan",
            onClick: () => router.push("/profile"),
        },
        {
            key: "home",
            icon: <HomeOutlined />,
            label: "Ve cua hang",
            onClick: () => router.push("/"),
        },
        { type: "divider" },
        {
            key: "logout",
            danger: true,
            icon: <LogoutOutlined />,
            label: "Dang xuat",
            onClick: handleLogout,
        },
    ];

    const activeKey =
        pathname.startsWith("/admin/ai")
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
                aria-label="DPWOOD Admin"
            >
                <Image src="/logo.png" alt="DPWOOD" width={38} height={38} className="dp-admin-brand-logo" />
                {(!collapsed || isMobile) && <strong>DPWOOD Admin</strong>}
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
                width={300}
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
                        overlayClassName="dp-admin-user-dropdown"
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
