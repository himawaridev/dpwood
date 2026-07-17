import { Button, Col, Input, InputNumber, Row, Select, Space, Switch, Tooltip, Typography } from "antd";
import { ClearOutlined, HeartFilled, HeartOutlined, SearchOutlined } from "@ant-design/icons";
import { KITCHEN_COLOR_OPTIONS } from "@/utils/kitchenProduct";
import { formatPriceInput, parsePriceInput } from "../catalogFilters";

const { Text } = Typography;

export default function ProductCatalogFilters({
    query,
    category,
    color,
    sortBy,
    onlyInStock,
    material,
    brand,
    minPrice,
    maxPrice,
    minRating,
    onlyWishlist,
    productCategories,
    facets,
    onQueryChange,
    onCategoryChange,
    onColorChange,
    onSortChange,
    onStockChange,
    onMaterialChange,
    onBrandChange,
    onMinPriceChange,
    onMaxPriceChange,
    onMinRatingChange,
    onWishlistChange,
    onReset,
}) {
    return (
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
                                onChange={(event) => onQueryChange(event.target.value)}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                            <Select
                                size="large"
                                value={category}
                                onChange={onCategoryChange}
                                style={{ width: "100%" }}
                                options={[
                                    { value: "all", label: "Tất cả danh mục" },
                                    ...productCategories.map((item) => ({ value: item.value, label: item.label })),
                                ]}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                            <Select
                                size="large"
                                value={color}
                                onChange={onColorChange}
                                style={{ width: "100%" }}
                                options={[
                                    { value: "all", label: "Tất cả màu" },
                                    ...[...new Set([...KITCHEN_COLOR_OPTIONS, ...(facets.colors || [])])].map((item) => ({
                                        value: item,
                                        label: item,
                                    })),
                                ]}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                            <Select
                                size="large"
                                value={sortBy}
                                onChange={onSortChange}
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
                                        onChange={onStockChange}
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
                            onChange={onMaterialChange}
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
                            onChange={onBrandChange}
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
                            onChange={onMinPriceChange}
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
                            onChange={onMaxPriceChange}
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
                            onChange={onMinRatingChange}
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
                                    onClick={() => onWishlistChange(!onlyWishlist)}
                                />
                            </Tooltip>
                            <Tooltip title="Xóa bộ lọc">
                                <Button
                                    type="text"
                                    size="large"
                                    className="dp-filter-icon-button"
                                    icon={<ClearOutlined />}
                                    aria-label="Xóa bộ lọc"
                                    onClick={onReset}
                                />
                            </Tooltip>
                        </div>
                    </Col>
                </Row>
            </div>
        </section>
    );
}
