"use client";
import { Typography, Button, Row, Col, Flex } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import ProductCard from "./ProductCard";

const { Title } = Typography;

export default function ProductSection({ title, products, isMobile, showViewAll = true, icon, onBuyNow }) {
    const router = useRouter();

    if (!products || products.length === 0) return null;

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "0 16px" : "0 24px" }}>
            <Flex align="center" justify="space-between" style={{ marginBottom: isMobile ? 16 : 20 }}>
                <Title
                    level={isMobile ? 5 : 4}
                    style={{ margin: 0, color: "#141414", fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    {icon} {title}
                </Title>
                {showViewAll && (
                    <Button
                        type="link"
                        onClick={() => router.push("/products")}
                        style={{ fontWeight: 500, fontSize: 14, padding: 0 }}
                    >
                        Xem tất cả <ArrowRightOutlined />
                    </Button>
                )}
            </Flex>

            <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]}>
                {products.map((product) => (
                    <Col xs={12} sm={12} md={8} lg={6} key={product.id}>
                        <ProductCard
                            product={product}
                            onBuyNow={onBuyNow}
                            onClickDetail={() => router.push(`/products/${product.id}`)}
                        />
                    </Col>
                ))}
            </Row>
        </div>
    );
}