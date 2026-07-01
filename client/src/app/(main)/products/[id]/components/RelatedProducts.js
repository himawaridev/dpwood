import React from "react";
import { Typography, Row, Col } from "antd";
import ProductCard from "../../components/ProductCard";

const { Title } = Typography;

export default function RelatedProducts({ relatedProducts, onProductClick }) {
    if (!relatedProducts || relatedProducts.length === 0) return null;

    return (
        <div>
            <div style={{ marginBottom: 18 }}>
                <span className="dp-eyebrow">Có thể bạn thích</span>
                <Title level={2} className="dp-section-title">
                    Sản phẩm liên quan
                </Title>
            </div>
            <Row gutter={[20, 20]}>
                {relatedProducts.map((product) => (
                    <Col xs={24} sm={12} lg={6} key={product.id}>
                        <ProductCard
                            product={product}
                            onBuyNow={() => onProductClick(product.id)}
                            onClickDetail={() => onProductClick(product.id)}
                        />
                    </Col>
                ))}
            </Row>
        </div>
    );
}
