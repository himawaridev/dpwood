import React from "react";
import { Typography } from "antd";

const { Title, Paragraph } = Typography;

export default function ProductDescription({ description }) {
    return (
        <div>
            <Title level={3} style={{ marginBottom: 12 }}>
                Mô tả sản phẩm
            </Title>
            <Paragraph
                style={{
                    fontSize: 15,
                    lineHeight: 1.8,
                    whiteSpace: "pre-line",
                    color: "var(--dp-muted)",
                    marginBottom: 0,
                }}
            >
                {description ||
                    "Thông tin chi tiết cho sản phẩm đồ bếp này đang được cập nhật. Bạn có thể liên hệ cửa hàng để được tư vấn thêm về chất liệu, cách dùng và bảo quản."}
            </Paragraph>
        </div>
    );
}
