"use client";

import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { Alert, App, Button, Col, Empty, Pagination, Row, Skeleton, Space, Typography } from "antd";
import {
    AppstoreOutlined,
    ReloadOutlined,
    ShoppingCartOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import ProductGrid from "./components/ProductGrid";
import ProductCatalogFilters from "./components/ProductCatalogFilters";
import { addCatalogProductToCart } from "@/utils/cartStorage";

const { Text } = Typography;

export default function ProductsPage() {
    const { message } = App.useApp();
    const [products, setProducts] = useState([]);
    const [productCategories, setProductCategories] = useState([]);
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
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
    const deferredQuery = useDeferredValue(query);
    const router = useRouter();

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage("");
            if (onlyWishlist && wishlistIds.size === 0) {
                setProducts([]);
                setPagination({ page: 1, limit: 12, total: 0, totalPages: 1 });
                return;
            }
            const productResponse = await api.get("/products", {
                params: {
                    withFacets: true,
                    page,
                    limit: 12,
                    search: deferredQuery || undefined,
                    sort: sortBy,
                    category: category !== "all" ? category : undefined,
                    color: color !== "all" ? color : undefined,
                    material: material !== "all" ? material : undefined,
                    brand: brand !== "all" ? brand : undefined,
                    minPrice: minPrice ?? undefined,
                    maxPrice: maxPrice ?? undefined,
                    minRating: minRating || undefined,
                    inStock: onlyInStock || undefined,
                    ids: onlyWishlist ? [...wishlistIds].join(",") : undefined,
                },
            });
            setProducts(productResponse.data?.products || []);
            setFacets(productResponse.data?.facets || { categories: [], materials: [], colors: [], brands: [] });
            setPagination(productResponse.data?.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });
        } catch (error) {
            setProducts([]);
            setErrorMessage(error.response?.data?.message || error.message || "Không thể tải sản phẩm.");
        } finally {
            setLoading(false);
        }
    }, [page, deferredQuery, sortBy, category, color, material, brand, minPrice, maxPrice, minRating, onlyInStock, onlyWishlist, wishlistIds]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        api.get("/products/categories")
            .then((response) => setProductCategories(response.data || []))
            .catch(() => setProductCategories([]));
    }, []);

    useEffect(() => {
        setPage(1);
    }, [deferredQuery, sortBy, category, color, material, brand, minPrice, maxPrice, minRating, onlyInStock, onlyWishlist]);

    useEffect(() => {
        if (!localStorage.getItem("token")) return;

        api.get("/products/wishlist/me", { authRequired: true })
            .then((res) => {
                setWishlistIds(new Set((res.data || []).map((item) => String(item.productId))));
            })
            .catch(() => setWishlistIds(new Set()));
    }, []);

    useEffect(() => {
        const syncFiltersFromUrl = () => {
            const params = new URLSearchParams(window.location.search);
            setQuery(params.get("search") || "");
            setCategory(params.get("category") || "all");
            setOnlyWishlist(params.get("wishlist") === "true");
        };
        const showWishlist = () => setOnlyWishlist(true);

        syncFiltersFromUrl();
        window.addEventListener("popstate", syncFiltersFromUrl);
        window.addEventListener("wishlist-filter-requested", showWishlist);
        return () => {
            window.removeEventListener("popstate", syncFiltersFromUrl);
            window.removeEventListener("wishlist-filter-requested", showWishlist);
        };
    }, []);

    const addToCartLogic = (product) => {
        addCatalogProductToCart(product);
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
            const res = await api.post(
                `/products/${product.id}/wishlist`,
                undefined,
                { authRequired: true },
            );
            setWishlistIds((current) => {
                const next = new Set(current);
                if (res.data?.wished) next.add(String(product.id));
                else next.delete(String(product.id));
                return next;
            });
            window.dispatchEvent(new Event("wishlist-updated"));
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

    const filteredProducts = products;

    const emptyDescription = products.length
        ? "Không tìm thấy sản phẩm đồ bếp phù hợp với bộ lọc hiện tại."
        : "Database đang trống. Sau khi thêm sản phẩm trong admin, cửa hàng sẽ tự hiển thị dữ liệu.";

    return (
        <div className="dp-page">
            <div className="dp-container">
                <ProductCatalogFilters
                    query={query}
                    category={category}
                    color={color}
                    sortBy={sortBy}
                    onlyInStock={onlyInStock}
                    material={material}
                    brand={brand}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    minRating={minRating}
                    onlyWishlist={onlyWishlist}
                    productCategories={productCategories}
                    facets={facets}
                    onQueryChange={setQuery}
                    onCategoryChange={setCategory}
                    onColorChange={setColor}
                    onSortChange={setSortBy}
                    onStockChange={setOnlyInStock}
                    onMaterialChange={setMaterial}
                    onBrandChange={setBrand}
                    onMinPriceChange={setMinPrice}
                    onMaxPriceChange={setMaxPrice}
                    onMinRatingChange={setMinRating}
                    onWishlistChange={handleWishlistFilterChange}
                    onReset={resetFilters}
                />

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
                        <AppstoreOutlined /> Hiển thị <strong>{filteredProducts.length}</strong> trong tổng số <strong>{pagination.total}</strong> sản phẩm
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
                {!loading && pagination.totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
                        <Pagination
                            current={pagination.page}
                            pageSize={pagination.limit}
                            total={pagination.total}
                            showSizeChanger={false}
                            onChange={(nextPage) => {
                                setPage(nextPage);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
