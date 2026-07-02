"use client";

import { useEffect, useState } from "react";
import { App, Button, Col, Row, Typography, Tag } from "antd";
import { CopyOutlined, ScissorOutlined } from "@ant-design/icons";
import api from "@/utils/axios";

const { Text, Title } = Typography;

export default function VoucherSection() {
    const { message } = App.useApp();
    const [vouchers, setVouchers] = useState([]);

    useEffect(() => {
        api.get("/coupons/active")
            .then((res) => setVouchers(res.data || []))
            .catch(() => setVouchers([]));
    }, []);

    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        message.success(`ÄÃ£ sao chÃ©p mÃ£: ${code}`);
    };

    if (vouchers.length === 0) return null;

    return (
        <section style={{ background: "var(--dp-surface)", borderTop: "1px solid var(--dp-soft-border)" }}>
            <div className="dp-container" style={{ padding: "34px 20px" }}>
                <div style={{ marginBottom: 18 }}>
                    <span className="dp-eyebrow">Æ¯u Ä‘Ã£i</span>
                    <Title level={2} className="dp-section-title">
                        MÃ£ giáº£m giÃ¡ Ä‘ang hoáº¡t Ä‘á»™ng
                    </Title>
                </div>
                <Row gutter={[16, 16]}>
                    {vouchers.slice(0, 4).map((voucher) => (
                        <Col xs={24} sm={12} lg={6} key={voucher.id}>
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => copyCode(voucher.code)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        copyCode(voucher.code);
                                    }
                                }}
                                className="dp-card-hover"
                                style={{
                                    width: "100%",
                                    minHeight: 150,
                                    textAlign: "left",
                                    padding: 18,
                                    background: "#fff",
                                    border: "1px dashed var(--dp-accent)",
                                    borderRadius: 8,
                                    cursor: "pointer",
                                }}
                            >
                                <Tag color="warning" icon={<ScissorOutlined />} style={{ marginBottom: 12 }}>
                                    {voucher.discountType === "percent"
                                        ? `Giảm ${Number(voucher.discountValue)}%`
                                        : `Giảm ${new Intl.NumberFormat("vi-VN").format(voucher.discountValue)}đ`}
                                </Tag>
                                <Title level={4} style={{ margin: 0 }}>
                                    {voucher.code}
                                </Title>
                                <Text className="dp-muted">
                                    {voucher.description || "Ãp dá»¥ng cho Ä‘Æ¡n hÃ ng phÃ¹ há»£p"}
                                </Text>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginTop: 16,
                                    }}
                                >
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Háº¿t háº¡n: {new Date(voucher.expiryDate).toLocaleDateString("vi-VN")}
                                    </Text>
                                    <Button
                                        size="small"
                                        icon={<CopyOutlined />}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            copyCode(voucher.code);
                                        }}
                                    >
                                        ChÃ©p
                                    </Button>
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>
            </div>
        </section>
    );
}
