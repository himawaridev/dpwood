import React from "react";
import { Typography } from "antd";

const { Title, Paragraph } = Typography;

export default function ProductDescription({ description, careInstructions, safetyInstructions }) {
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
            {careInstructions && (
                <>
                    <Title level={4} style={{ marginTop: 22 }}>Hướng dẫn sử dụng và bảo quản</Title>
                    <Paragraph style={{ whiteSpace: "pre-line", lineHeight: 1.8 }}>{careInstructions}</Paragraph>
                </>
            )}
            {safetyInstructions && (
                <>
                    <Title level={4} style={{ marginTop: 22 }}>Lưu ý an toàn</Title>
                    <Paragraph style={{ whiteSpace: "pre-line", lineHeight: 1.8 }}>{safetyInstructions}</Paragraph>
                </>
            )}
        </div>
    );
}
