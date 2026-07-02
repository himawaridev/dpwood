import React from "react";
import { Typography } from "antd";
import { getKitchenCategoryLabel } from "@/utils/kitchenProduct";

const { Text } = Typography;

const booleanLabel = (value) => (value ? "Dùng được" : "Không khuyến nghị");

export default function ProductKitchenSpecs({ product, selectedVariant }) {
    const specs = [
        { label: "Danh mục", value: getKitchenCategoryLabel(product.category) },
        { label: "Thương hiệu", value: product.brand },
        { label: "Chất liệu", value: product.material },
        { label: "Màu sắc", value: selectedVariant?.color || product.color },
        { label: "Kích cỡ / dung tích", value: selectedVariant?.size || selectedVariant?.capacity || product.capacity },
        { label: "Xuất xứ", value: product.origin },
        { label: "Bảo hành", value: product.warranty },
        { label: "Máy rửa chén", value: booleanLabel(product.dishwasherSafe) },
        { label: "Lò vi sóng", value: booleanLabel(product.microwaveSafe) },
    ].filter((item) => item.value);

    if (!specs.length) return null;

    return (
        <div className="dp-kitchen-specs dp-kitchen-specs-under-gallery">
            <Text strong className="dp-kitchen-specs-title">
                Thông số đồ bếp
            </Text>
            <div className="dp-kitchen-spec-grid">
                {specs.map((item) => (
                    <div key={item.label} className="dp-kitchen-spec-item">
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                    </div>
                ))}
            </div>
        </div>
    );
}
