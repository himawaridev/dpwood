"use client";
import { useEffect, useState } from "react";
import { Typography, message } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";

// 🔴 Import component đã chia nhỏ
import ProductGrid from "./components/ProductGrid";

const { Title } = Typography;

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

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

    // Hàm xử lý Thêm vào giỏ hàng (Giữ nguyên logic tuyệt đối an toàn)
    const addToCartLogic = (product) => {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        const existingItemIndex = cart.findIndex((item) => item.productId === product.id);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += 1;
        } else {
            cart.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                quantity: 1,
            });
        }
        localStorage.setItem("cart", JSON.stringify(cart));
    };

    // Hàm Xử lý MUA NGAY: Thêm vào giỏ và đi tới trang thanh toán
    const handleBuyNow = (product) => {
        addToCartLogic(product);
        message.success(`Đã thêm ${product.name} vào giỏ hàng. Đang chuyển hướng...`);
        router.push("/cart");
    };

    return (
        <div style={{ padding: "40px 20px", background: "#f0f2f5", minHeight: "100vh" }}>
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
                    onBuyNow={handleBuyNow}
                    onClickDetail={(productId) => router.push(`/products/${productId}`)}
                />
            </div>
        </div>
    );
}
