import { AppstoreOutlined } from "@ant-design/icons";
import { Col, Row, Typography } from "antd";
import ProductCard from "@/app/(main)/products/components/ProductCard";
import { HomeProductEmptyState, HomeProductSkeletonGrid } from "./HomeProductStates";
import HomeViewAllLink from "./HomeViewAllLink";

const { Title } = Typography;

export default function HomeProductSection({
    title,
    products,
    loading,
    skeletonCount = 8,
    className = "",
    wrapHeading = false,
    badge,
    wishlistIds,
    wishlistLoadingId,
    onAddToCart,
    onOpenProduct,
    onToggleWishlist,
    onRetry,
    viewAllHref,
}) {
    const heading = (
        <Title level={2} className="webcake-section-title">
            {title}
        </Title>
    );

    return (
        <section className={["webcake-section", className].filter(Boolean).join(" ")}>
            <div className="webcake-container">
                {wrapHeading ? <div className="webcake-section-head">{heading}</div> : heading}

                {loading ? (
                    <HomeProductSkeletonGrid count={skeletonCount} />
                ) : products.length ? (
                    <Row gutter={[30, 36]}>
                        {products.map((product, index) => (
                            <Col xs={12} md={8} lg={6} key={`${product.id}-${index}`}>
                                <ProductCard
                                    product={product}
                                    badge={badge}
                                    onBuyNow={onAddToCart}
                                    onClickDetail={() => onOpenProduct(product)}
                                    wished={wishlistIds.has(String(product.id))}
                                    wishlistLoading={wishlistLoadingId === String(product.id)}
                                    onToggleWishlist={onToggleWishlist}
                                />
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <HomeProductEmptyState onRetry={onRetry} />
                )}

                {viewAllHref && (
                    <HomeViewAllLink
                        href={viewAllHref}
                        label="XEM TẤT CẢ SẢN PHẨM"
                        icon={<AppstoreOutlined />}
                    />
                )}
            </div>
        </section>
    );
}
