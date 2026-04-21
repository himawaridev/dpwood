import MainLayoutClient from "./MainLayoutClient";

export const metadata = {
    title: 'DPWOOD Store - Nội Thất Gỗ Cao Cấp',
    description: 'Cửa hàng nội thất và các sản phẩm từ gỗ cao cấp. Thiết kế sang trọng, chất lượng bền bỉ.',
    openGraph: {
        title: 'DPWOOD Store - Nội Thất Gỗ Cao Cấp',
        description: 'Cửa hàng nội thất và các sản phẩm từ gỗ cao cấp. Thiết kế sang trọng, chất lượng bền bỉ.',
        images: [{ url: 'https://dpwood.store/linkbanner.png', width: 1200, height: 630 }],
    },
};

export default function MainLayout({ children }) {
    return <MainLayoutClient>{children}</MainLayoutClient>;
}
