"use client";

import Image from "next/image";
import { Col, Row, Skeleton, Typography } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import HomeViewAllLink from "@/components/home/HomeViewAllLink";

const { Title } = Typography;

export default function HomeCategorySection({ categories, loading, onOpenCategory }) {
    return (
        <section className="webcake-section webcake-category-section">
            <div className="webcake-container">
                <Title level={2} className="webcake-section-title">Danh mục sản phẩm</Title>
                {loading ? (
                    <Row gutter={[30, 30]}>
                        {Array.from({ length: 3 }).map((_, index) => (
                            <Col xs={24} sm={12} lg={8} key={index}>
                                <div className="webcake-category-skeleton"><Skeleton.Image active /></div>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <Row gutter={[30, 30]}>
                        {categories.slice(0, 6).map((category) => (
                            <Col xs={24} sm={12} lg={8} key={category.value}>
                                <button
                                    type="button"
                                    className="webcake-category-card"
                                    onClick={() => onOpenCategory(category.value)}
                                    aria-label={`Xem danh mục ${category.label}`}
                                >
                                    <Image
                                        src={category.image}
                                        alt={category.label}
                                        width={760}
                                        height={848}
                                        unoptimized
                                        onError={(event) => {
                                            if (event.currentTarget.dataset.fallbackApplied) return;
                                            event.currentTarget.dataset.fallbackApplied = "true";
                                            event.currentTarget.src = category.fallbackImage;
                                        }}
                                    />
                                    <span className="webcake-category-label">
                                        <span className="webcake-category-icon"><AppstoreOutlined /></span>
                                        <strong>{category.label}</strong>
                                    </span>
                                </button>
                            </Col>
                        ))}
                    </Row>
                )}
                {!loading && categories.length > 6 && (
                    <HomeViewAllLink
                        href="/products"
                        label="XEM TẤT CẢ DANH MỤC"
                        icon={<AppstoreOutlined />}
                    />
                )}
            </div>
        </section>
    );
}
