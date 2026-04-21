import AdminLayoutClient from "./AdminLayoutClient";

export const metadata = {
    title: 'Quản Trị DPWOOD',
    description: 'Trang quản trị hệ thống DPWOOD Store - Quản lý sản phẩm, đơn hàng, người dùng.',
    openGraph: {
        title: 'Quản Trị DPWOOD',
        description: 'Trang quản trị hệ thống DPWOOD Store.',
        images: [{ url: 'https://dpwood.store/linkbanner.png', width: 1200, height: 630 }],
    },
    robots: {
        index: false,
        follow: false,
    },
};

export default function AdminLayout({ children }) {
    return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
