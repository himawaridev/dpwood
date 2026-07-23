"use client";

import { Button, Carousel, Skeleton, Typography } from "antd";
import { formatBannerPriceText } from "@/utils/bannerPrice";

const { Paragraph, Text, Title } = Typography;

export default function HomeHero({ banners, loading, onOpenBanner, onOpenProducts }) {
    return (
        <section className="webcake-hero">
            <Carousel
                autoplay
                autoplaySpeed={4200}
                dots
                draggable
                pauseOnHover
                beforeChange={() => {
                    const activeElement = document.activeElement;
                    if (activeElement instanceof HTMLElement && activeElement.closest(".slick-slide")) {
                        activeElement.blur();
                    }
                }}
            >
                {banners.map((slide) => (
                    <div key={slide.id}>
                        <div
                            className="webcake-hero-slide"
                            style={{ "--webcake-hero-image": `url(${slide.imageUrl})` }}
                        >
                            <div className="webcake-hero-copy">
                                {slide.eyebrow && <span className="webcake-hero-eyebrow">{slide.eyebrow}</span>}
                                <Title level={1}>{slide.title}</Title>
                                {slide.description && (
                                    <Paragraph className="dp-line-clamp-2">{slide.description}</Paragraph>
                                )}
                                {slide.priceText && (
                                    <Text className="webcake-hero-price">
                                        {formatBannerPriceText(slide.priceText)}
                                    </Text>
                                )}
                                <Button type="primary" onClick={() => onOpenBanner(slide.buttonLink)}>
                                    {slide.buttonText || "XEM SẢN PHẨM"}
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
                {!banners.length && loading && (
                    <div>
                        <div className="webcake-hero-slide webcake-hero-empty">
                            <div className="webcake-hero-copy">
                                <Skeleton active paragraph={{ rows: 3 }} title={{ width: "70%" }} />
                            </div>
                        </div>
                    </div>
                )}
                {!banners.length && !loading && (
                    <div>
                        <div
                            className="webcake-hero-slide"
                            style={{ "--webcake-hero-image": "url(/linkbanner.png)" }}
                        >
                            <div className="webcake-hero-copy">
                                <span className="webcake-hero-eyebrow">Gian bếp DPWOOD</span>
                                <Title level={1}>Đồ gia dụng nhà bếp cho từng bữa ăn</Title>
                                <Paragraph>
                                    Khám phá nồi chảo, dụng cụ bếp và sản phẩm tiện ích được chọn lọc.
                                </Paragraph>
                                <Button type="primary" onClick={onOpenProducts}>XEM CỬA HÀNG</Button>
                            </div>
                        </div>
                    </div>
                )}
            </Carousel>
        </section>
    );
}
