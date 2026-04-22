"use client";
import { useEffect, useState } from "react";
import { Typography, message } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import { useCart } from "@/hooks/useCart";

// 🔴 Import component đã chia nhỏ
import ProductGrid from "./components/ProductGrid";

const { Title } = Typography;

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { buyNow } = useCart();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get("/products");
                setProducts(res.data);
            } catch (error) {
                message.error("Không thể tải danh sách sản phẩm: " + error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    return (
        <div style={{ minHeight: "100vh" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
                <Title
                    level={2}
                    style={{ textAlign: "center", marginBottom: 40, color: "#001529" }}
                >
                    <AppstoreOutlined style={{ color: "#1677ff", marginRight: 12 }} />
                    Sản Phẩm Của Chúng Tôi
                </Title>

                {/* Component Lưới Sản Phẩm nhận dữ liệu và hàm xử lý */}
                <ProductGrid
                    loading={loading}
                    products={products}
                    onBuyNow={buyNow}
                    onClickDetail={(productId) => router.push(`/products/${productId}`)}
                />
            </div>
        </div>
    );
}
