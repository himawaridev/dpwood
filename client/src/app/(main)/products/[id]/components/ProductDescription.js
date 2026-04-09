import React from "react";
import { Typography } from "antd";

const { Title, Paragraph } = Typography;

export default function ProductDescription({ description }) {
    return (
        <div>
            <Title level={4} style={{ marginBottom: 16 }}>
                Mô tả chi tiết sản phẩm
            </Title>
            <Paragraph
                style={{
                    fontSize: "15px",
                    lineHeight: "1.8",
                    whiteSpace: "pre-line",
                    color: "#595959",
                    background: "#fafafa",
                    padding: "24px",
                    borderRadius: "12px",
                    border: "1px solid #f0f0f0",
                }}
            >
                {description || "Đang cập nhật thông tin chi tiết cho sản phẩm này."}
            </Paragraph>
        </div>
    );
}
