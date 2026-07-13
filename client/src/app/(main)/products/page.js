"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, App, Button, Col, Empty, Input, InputNumber, Row, Select, Skeleton, Space, Switch, Tooltip, Typography } from "antd";
import {
    AppstoreOutlined,
    ClearOutlined,
    HeartFilled,
    HeartOutlined,
    ReloadOutlined,
    SearchOutlined,
    ShoppingCartOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import { buildKitchenSearchText, KITCHEN_CATEGORY_OPTIONS, KITCHEN_COLOR_OPTIONS } from "@/utils/kitchenProduct";
import ProductGrid from "./components/ProductGrid";

const { Text } = Typography;

const normalizeText = (value = "") =>
    String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase();

const formatPriceInput = (value) => {
    if (value === null || value === undefined || value === "") return "";
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parsePriceInput = (value = "") => value.replace(/\./g, "").replace(/[^\d]/g, "");

export default function ProductsPage() {
    const { message } = App.useApp();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [query, setQuery] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [category, setCategory] = useState("all");
    const [color, setColor] = useState("all");
    const [material, setMaterial] = useState("all");
    const [brand, setBrand] = useState("all");
    const [minPrice, setMinPrice] = useState(null);
    const [maxPrice, setMaxPrice] = useState(null);
    const [minRating, setMinRating] = useState(0);
    const [onlyInStock, setOnlyInStock] = useState(false);
    const [onlyWishlist, setOnlyWishlist] = useState(false);
    const [facets, setFacets] = useState({ categories: [], materials: [], colors: [], brands: [] });
    const [wishlistIds, setWishlistIds] = useState(new Set());
    const [wishlistLoadingId, setWishlistLoadingId] = useState(null);
    const router = useRouter();

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage("");
            const res = await api.get("/products", { params: { withFacets: true } });
            setProducts(res.data?.products || []);
            setFacets(res.data?.facets || { categories: [], materials: [], colors: [], brands: [] });
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
        if (!localStorage.getItem("token")) return;

        api.get("/products/wishlist/me")
            .then((res) => {
                setWishlistIds(new Set((res.data || []).map((item) => String(item.productId))));
            })
            .catch(() => setWishlistIds(new Set()));
    }, []);

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

    const handleToggleWishlist = async (product) => {
        if (!localStorage.getItem("token")) {
            message.warning("Vui lòng đăng nhập để lưu sản phẩm yêu thích.");
            router.push("/login");
            return;
        }

        try {
            setWishlistLoadingId(String(product.id));
            const res = await api.post(`/products/${product.id}/wishlist`);
            setWishlistIds((current) => {
                const next = new Set(current);
                if (res.data?.wished) next.add(String(product.id));
                else next.delete(String(product.id));
                return next;
            });
            message.success(res.data?.wished ? "Đã thêm vào danh sách yêu thích." : "Đã bỏ khỏi danh sách yêu thích.");
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể cập nhật danh sách yêu thích.");
        } finally {
            setWishlistLoadingId(null);
        }
    };

    const resetFilters = () => {
        setQuery("");
        setSortBy("newest");
        setCategory("all");
        setColor("all");
        setMaterial("all");
        setBrand("all");
        setMinPrice(null);
        setMaxPrice(null);
        setMinRating(0);
        setOnlyInStock(false);
        setOnlyWishlist(false);
    };

    const handleWishlistFilterChange = (checked) => {
        if (checked && !localStorage.getItem("token")) {
            message.warning("Vui lòng đăng nhập để xem danh sách yêu thích.");
            router.push("/login");
            return;
        }
        setOnlyWishlist(checked);
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
                const matchesMaterial = material === "all" ? true : product.material === material;
                const matchesBrand = brand === "all" ? true : product.brand === brand;
                const price = Number(product.price || 0);
                const matchesPrice = (minPrice === null || price >= minPrice) && (maxPrice === null || price <= maxPrice);
                const matchesRating = Number(product.rating || 0) >= minRating;
                const matchesStock = onlyInStock ? Number(product.stock || 0) > 0 : true;
                const matchesWishlist = onlyWishlist ? wishlistIds.has(String(product.id)) : true;
                return matchesQuery && matchesCategory && matchesColor && matchesMaterial && matchesBrand && matchesPrice && matchesRating && matchesStock && matchesWishlist;
            })
            .sort((a, b) => {
                if (sortBy === "priceAsc") return Number(a.price || 0) - Number(b.price || 0);
                if (sortBy === "priceDesc") return Number(b.price || 0) - Number(a.price || 0);
                if (sortBy === "sold") return Number(b.sold || 0) - Number(a.sold || 0);
                if (sortBy === "rating") return Number(b.rating || 0) - Number(a.rating || 0);
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });
    }, [products, query, sortBy, category, color, material, brand, minPrice, maxPrice, minRating, onlyInStock, onlyWishlist, wishlistIds]);

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
                        <Col xs={24}>
                            <Space orientation="vertical" size={4}>
                                <span className="dp-eyebrow">Cửa hàng</span>
                                <Text className="dp-muted">
                                    Tìm nồi chảo, dụng cụ bếp, bộ bàn ăn và các sản phẩm tiện ích cho căn bếp.
                                </Text>
                            </Space>
                        </Col>
                        <Col xs={24}>
                            <Row gutter={[12, 12]}>
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
                                            ...[...new Set([...KITCHEN_COLOR_OPTIONS, ...(facets.colors || [])])].map((item) => ({ value: item, label: item })),
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
                                            { value: "rating", label: "Đánh giá cao" },
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
                                        <Tooltip title={onlyInStock ? "Hiển thị tất cả sản phẩm" : "Chỉ hiển thị sản phẩm còn hàng"}>
                                            <Switch
                                                checked={onlyInStock}
                                                onChange={setOnlyInStock}
                                                aria-label="Chỉ hiển thị sản phẩm còn hàng"
                                            />
                                        </Tooltip>
                                    </div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>

                    <div className="dp-product-advanced-filters">
                        <Row gutter={[12, 12]} align="middle">
                            <Col xs={24} sm={12} lg={4}>
                                <Select
                                    size="large"
                                    value={material}
                                    onChange={setMaterial}
                                    style={{ width: "100%" }}
                                    options={[
                                        { value: "all", label: "Tất cả chất liệu" },
                                        ...(facets.materials || []).map((item) => ({ value: item, label: item })),
                                    ]}
                                />
                            </Col>
                            <Col xs={24} sm={12} lg={4}>
                                <Select
                                    size="large"
                                    value={brand}
                                    onChange={setBrand}
                                    style={{ width: "100%" }}
                                    options={[
                                        { value: "all", label: "Tất cả thương hiệu" },
                                        ...(facets.brands || []).map((item) => ({ value: item, label: item })),
                                    ]}
                                />
                            </Col>
                            <Col xs={12} sm={12} lg={4}>
                                <InputNumber
                                    size="large"
                                    min={0}
                                    precision={0}
                                    value={minPrice}
                                    onChange={setMinPrice}
                                    placeholder="Giá từ"
                                    controls={false}
                                    formatter={formatPriceInput}
                                    parser={parsePriceInput}
                                    addonAfter="₫"
                                    style={{ width: "100%" }}
                                />
                            </Col>
                            <Col xs={12} sm={12} lg={4}>
                                <InputNumber
                                    size="large"
                                    min={0}
                                    precision={0}
                                    value={maxPrice}
                                    onChange={setMaxPrice}
                                    placeholder="Giá đến"
                                    controls={false}
                                    formatter={formatPriceInput}
                                    parser={parsePriceInput}
                                    addonAfter="₫"
                                    style={{ width: "100%" }}
                                />
                            </Col>
                            <Col xs={12} sm={12} lg={4}>
                                <Select
                                    size="large"
                                    value={minRating}
                                    onChange={setMinRating}
                                    style={{ width: "100%" }}
                                    options={[
                                        { value: 0, label: "Mọi đánh giá" },
                                        { value: 4, label: "Từ 4 sao" },
                                        { value: 3, label: "Từ 3 sao" },
                                        { value: 2, label: "Từ 2 sao" },
                                    ]}
                                />
                            </Col>
                            <Col xs={12} sm={12} lg={4}>
                                <div className="dp-product-filter-actions">
                                    <Tooltip title={onlyWishlist ? "Tắt bộ lọc yêu thích" : "Chỉ xem sản phẩm yêu thích"}>
                                        <Button
                                            type="text"
                                            className="dp-wishlist-filter-button"
                                            icon={onlyWishlist ? <HeartFilled /> : <HeartOutlined />}
                                            aria-label={onlyWishlist ? "Tắt bộ lọc yêu thích" : "Chỉ xem sản phẩm yêu thích"}
                                            aria-pressed={onlyWishlist}
                                            onClick={() => handleWishlistFilterChange(!onlyWishlist)}
                                        />
                                    </Tooltip>
                                    <Tooltip title="Xóa bộ lọc">
                                        <Button
                                            type="text"
                                            size="large"
                                            className="dp-filter-icon-button"
                                            icon={<ClearOutlined />}
                                            aria-label="Xóa bộ lọc"
                                            onClick={resetFilters}
                                        />
                                    </Tooltip>
                                </div>
                            </Col>
                        </Row>
                    </div>
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
                        wishlistIds={wishlistIds}
                        wishlistLoadingId={wishlistLoadingId}
                        onToggleWishlist={handleToggleWishlist}
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
