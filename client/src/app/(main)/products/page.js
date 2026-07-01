"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, App, Button, Col, Empty, Input, Row, Select, Skeleton, Space, Switch, Typography } from "antd";
import { AppstoreOutlined, ReloadOutlined, SearchOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import ProductGrid from "./components/ProductGrid";

const { Title, Text } = Typography;

export default function ProductsPage() {
    const { message } = App.useApp();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [query, setQuery] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [onlyInStock, setOnlyInStock] = useState(false);
    const router = useRouter();

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage("");
            const res = await api.get("/products");
            setProducts(res.data || []);
        } catch (error) {
            setProducts([]);
            setErrorMessage(error.response?.data?.message || error.message || "Không thể tải sản phẩm.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        const nextSearch = new URLSearchParams(window.location.search).get("search");
        if (nextSearch) setQuery(nextSearch);
    }, []);

    const addToCartLogic = (product) => {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
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
        window.dispatchEvent(new Event("cart-updated"));
    };

    const handleBuyNow = (product) => {
        addToCartLogic(product);
        message.success(`Đã thêm ${product.name} vào giỏ hàng.`);
        router.push("/cart");
    };

    const filteredProducts = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);
        const nextProducts = products
            .filter((product) => {
                const searchableText = `${product.name || ""} ${product.description || ""}`.toLowerCase();
                const matchesQuery = !queryTerms.length
                    ? true
                    : queryTerms.some((term) => searchableText.includes(term));
                const matchesStock = onlyInStock ? Number(product.stock || 0) > 0 : true;
                return matchesQuery && matchesStock;
            })
            .sort((a, b) => {
                if (sortBy === "priceAsc") return Number(a.price || 0) - Number(b.price || 0);
                if (sortBy === "priceDesc") return Number(b.price || 0) - Number(a.price || 0);
                if (sortBy === "sold") return Number(b.sold || 0) - Number(a.sold || 0);
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });

        return nextProducts;
    }, [products, query, sortBy, onlyInStock]);

    const emptyDescription = products.length
        ? "Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại"
        : "Database đang trống. Sau khi thêm sản phẩm trong admin, cửa hàng sẽ tự hiển thị dữ liệu.";

    return (
        <div className="dp-page">
            <div className="dp-container">
                <section
                    className="dp-panel"
                    style={{
                        padding: "28px clamp(18px, 4vw, 36px)",
                        marginBottom: 24,
                    }}
                >
                    <Row gutter={[20, 20]} align="middle">
                        <Col xs={24} lg={10}>
                            <Space orientation="vertical" size={4}>
                                <span className="dp-eyebrow">Cửa hàng</span>
                                <Title level={1} className="dp-section-title">
                                    Sản phẩm DPWOOD
                                </Title>
                                <Text className="dp-muted">
                                    Tìm sản phẩm, xem tồn kho và đặt hàng trực tiếp trong một luồng.
                                </Text>
                            </Space>
                        </Col>
                        <Col xs={24} lg={14}>
                            <Row gutter={[12, 12]} justify="end">
                                <Col xs={24} md={12}>
                                    <Input
                                        size="large"
                                        allowClear
                                        prefix={<SearchOutlined />}
                                        placeholder="Tìm theo tên hoặc mô tả"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                    />
                                </Col>
                                <Col xs={24} sm={12} md={7}>
                                    <Select
                                        size="large"
                                        value={sortBy}
                                        onChange={setSortBy}
                                        style={{ width: "100%" }}
                                        options={[
                                            { value: "newest", label: "Mới nhất" },
                                            { value: "sold", label: "Bán chạy" },
                                            { value: "priceAsc", label: "Giá thấp đến cao" },
                                            { value: "priceDesc", label: "Giá cao đến thấp" },
                                        ]}
                                    />
                                </Col>
                                <Col xs={24} sm={12} md={5}>
                                    <div
                                        style={{
                                            height: 48,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "flex-end",
                                            gap: 8,
                                        }}
                                    >
                                        <Switch checked={onlyInStock} onChange={setOnlyInStock} />
                                        <Text strong>Còn hàng</Text>
                                    </div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </section>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 16,
                        gap: 12,
                        flexWrap: "wrap",
                    }}
                >
                    <Text className="dp-muted">
                        <AppstoreOutlined /> Hiển thị <strong>{filteredProducts.length}</strong> sản phẩm
                    </Text>
                    <Space wrap>
                        {errorMessage && (
                            <Button icon={<ReloadOutlined />} onClick={fetchProducts} loading={loading}>
                                Thử lại
                            </Button>
                        )}
                        <Button
                            icon={<ShoppingCartOutlined />}
                            onClick={() => router.push("/cart")}
                            disabled={loading}
                        >
                            Xem giỏ hàng
                        </Button>
                    </Space>
                </div>

                {errorMessage && !loading && (
                    <Alert
                        type="warning"
                        showIcon
                        style={{ marginBottom: 18 }}
                        message="Chưa tải được danh sách sản phẩm"
                        description="Backend hoặc database có thể chưa sẵn sàng. Hãy kiểm tra Docker server rồi bấm thử lại."
                    />
                )}

                {loading ? (
                    <Row gutter={[20, 20]}>
                        {Array.from({ length: 8 }).map((_, index) => (
                            <Col xs={24} sm={12} lg={6} key={index}>
                                <div className="dp-panel" style={{ padding: 16 }}>
                                    <Skeleton.Image active style={{ width: "100%", height: 220 }} />
                                    <Skeleton active paragraph={{ rows: 3 }} style={{ marginTop: 16 }} />
                                </div>
                            </Col>
                        ))}
                    </Row>
                ) : filteredProducts.length ? (
                    <ProductGrid
                        loading={false}
                        products={filteredProducts}
                        onBuyNow={handleBuyNow}
                        onClickDetail={(productId) => router.push(`/products/${productId}`)}
                    />
                ) : (
                    <div className="dp-panel" style={{ padding: 44 }}>
                        <Empty description={emptyDescription} />
                    </div>
                )}
            </div>
        </div>
    );
}
