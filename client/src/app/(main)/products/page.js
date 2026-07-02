"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, App, Button, Col, Empty, Input, Row, Select, Skeleton, Space, Switch, Typography } from "antd";
import { AppstoreOutlined, ReloadOutlined, SearchOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import { buildKitchenSearchText, KITCHEN_CATEGORY_OPTIONS, KITCHEN_COLOR_OPTIONS } from "@/utils/kitchenProduct";
import ProductGrid from "./components/ProductGrid";

const { Title, Text } = Typography;

const normalizeText = (value = "") =>
    String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase();

export default function ProductsPage() {
    const { message } = App.useApp();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [query, setQuery] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [category, setCategory] = useState("all");
    const [color, setColor] = useState("all");
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
        const nextCategory = new URLSearchParams(window.location.search).get("category");
        if (nextCategory && KITCHEN_CATEGORY_OPTIONS.some((item) => item.value === nextCategory)) {
            setCategory(nextCategory);
        }
    }, []);

    const addToCartLogic = (product) => {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const cartItemId = product.id;
        const existingItemIndex = cart.findIndex((item) => (item.cartItemId || item.productId) === cartItemId);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += 1;
        } else {
            cart.push({
                cartItemId,
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
        const normalizedQuery = normalizeText(query.trim());
        const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);

        return products
            .filter((product) => {
                const searchableText = normalizeText(buildKitchenSearchText(product));
                const matchesQuery = !queryTerms.length
                    ? true
                    : queryTerms.some((term) => searchableText.includes(term));
                const matchesCategory = category === "all" ? true : product.category === category;
                const matchesColor = color === "all" ? true : product.color === color;
                const matchesStock = onlyInStock ? Number(product.stock || 0) > 0 : true;
                return matchesQuery && matchesCategory && matchesColor && matchesStock;
            })
            .sort((a, b) => {
                if (sortBy === "priceAsc") return Number(a.price || 0) - Number(b.price || 0);
                if (sortBy === "priceDesc") return Number(b.price || 0) - Number(a.price || 0);
                if (sortBy === "sold") return Number(b.sold || 0) - Number(a.sold || 0);
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });
    }, [products, query, sortBy, category, color, onlyInStock]);

    const emptyDescription = products.length
        ? "Không tìm thấy sản phẩm đồ bếp phù hợp với bộ lọc hiện tại."
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
                        <Col xs={24} lg={8}>
                            <Space orientation="vertical" size={4}>
                                <span className="dp-eyebrow">Cửa hàng</span>
                                <Title level={1} className="dp-section-title">
                                    Đồ gia dụng nhà bếp
                                </Title>
                                <Text className="dp-muted">
                                    Tìm nồi chảo, dụng cụ bếp, bộ bàn ăn và các sản phẩm tiện ích cho căn bếp.
                                </Text>
                            </Space>
                        </Col>
                        <Col xs={24} lg={16}>
                            <Row gutter={[12, 12]} justify="end">
                                <Col xs={24} md={8}>
                                    <Input
                                        size="large"
                                        allowClear
                                        prefix={<SearchOutlined />}
                                        placeholder="Tìm tên, chất liệu, thương hiệu..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                    />
                                </Col>
                                <Col xs={24} sm={12} md={4}>
                                    <Select
                                        size="large"
                                        value={category}
                                        onChange={setCategory}
                                        style={{ width: "100%" }}
                                        options={[{ value: "all", label: "Tất cả danh mục" }, ...KITCHEN_CATEGORY_OPTIONS]}
                                    />
                                </Col>
                                <Col xs={24} sm={12} md={4}>
                                    <Select
                                        size="large"
                                        value={color}
                                        onChange={setColor}
                                        style={{ width: "100%" }}
                                        options={[
                                            { value: "all", label: "Tất cả màu" },
                                            ...KITCHEN_COLOR_OPTIONS.map((item) => ({ value: item, label: item })),
                                        ]}
                                    />
                                </Col>
                                <Col xs={24} sm={12} md={4}>
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
                                <Col xs={24} sm={12} md={4}>
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
                        title="Chưa tải được danh sách sản phẩm"
                        description="Backend hoặc database có thể chưa sẵn sàng. Hãy kiểm tra Docker server rồi bấm thử lại."
                    />
                )}

                {loading ? (
                    <Row gutter={[20, 20]}>
                        {Array.from({ length: 8 }).map((_, index) => (
                            <Col xs={24} sm={12} lg={6} key={index}>
                                <div className="dp-panel dp-product-grid-skeleton">
                                    <Skeleton.Image active className="webcake-product-skeleton-image" />
                                    <Skeleton active paragraph={{ rows: 2 }} />
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
