"use client";
import { Menu } from "antd";
import {
    AppstoreOutlined,
    ReadOutlined,
    CustomerServiceOutlined,
    ShoppingCartOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";

export default function AppNavigation() {
    const router = useRouter();
    const pathname = usePathname();

    const navItems = [
        { key: "/products", icon: <AppstoreOutlined />, label: "Sản phẩm" },
        { key: "/blogs", icon: <ReadOutlined />, label: "Blogs" },
        { key: "/support", icon: <CustomerServiceOutlined />, label: "Hỗ trợ" },
        { key: "/cart", icon: <ShoppingCartOutlined />, label: "Giỏ hàng" },
    ];

    return (
        <Menu
            mode="horizontal"
            selectedKeys={[pathname]}
            items={navItems}
            onClick={({ key }) => router.push(key)}
            style={{
                flex: 1,
                background: "transparent",
                color: "#fff",
                borderBottom: "none",
            }}
            theme="dark"
        />
    );
}
