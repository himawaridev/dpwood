import React from "react";
import { Modal, Flex, Alert, Image, Divider, Typography, Button, Spin } from "antd";
import { QrcodeOutlined, LinkOutlined, ReloadOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function PaymentQRModal({
    isQrModalVisible,
    payosData,
    checkingPayment,
    handleCheckPayment,
    handleCancelPayment,
}) {
    return (
        <Modal
            title={
                <Flex gap="small" align="center">
                    <QrcodeOutlined style={{ color: "#1677ff" }} />
                    Thanh toán tự động
                </Flex>
            }
            open={isQrModalVisible}
            footer={null}
            closable={false}
            mask={{ closable: false }}
            centered
            width={480}
        >
            <Flex vertical align="center" gap="large">
                <Alert
                    title="Duyệt đơn tự động trong 5 giây"
                    description="Hệ thống PayOS sẽ ghi nhận và tự động xử lý ngay khi nhận được tiền."
                    type="info"
                    showIcon
                    style={{ width: "100%" }}
                />
                <div
                    style={{
                        padding: 16,
                        border: "1px solid #f0f0f0",
                        borderRadius: 16,
                        background: "#fff",
                        textAlign: "center",
                        width: "100%",
                    }}
                >
                    {payosData ? (
                        <Flex vertical align="center" gap="middle">
                            <Image
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payosData.qrCode)}`}
                                width={220}
                                preview={false}
                            />
                            <Divider plain style={{ margin: "8px 0" }}>
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    Hoặc chuyển khoản thủ công
                                </Text>
                            </Divider>
                            <div
                                style={{
                                    background: "#f9f9f9",
                                    padding: "16px",
                                    borderRadius: "12px",
                                    width: "100%",
                                    textAlign: "left",
                                }}
                            >
                                <Flex vertical gap="small">
                                    <Flex justify="space-between" align="center">
                                        <Text type="secondary">Ngân hàng:</Text>
                                        <Text strong>Theo mã QR (Mã BIN: {payosData.bin})</Text>
                                    </Flex>
                                    <Flex justify="space-between" align="center">
                                        <Text type="secondary">Chủ tài khoản:</Text>
                                        <Text strong>{payosData.accountName}</Text>
                                    </Flex>
                                    <Flex justify="space-between" align="center">
                                        <Text type="secondary">Số tài khoản:</Text>
                                        <div style={{ textAlign: "right" }}>
                                            <Text
                                                strong
                                                copyable={{ tooltips: ["Sao chép", "Đã chép"] }}
                                                style={{ color: "#1677ff", fontSize: 15 }}
                                            >
                                                {payosData.accountNumber}
                                            </Text>
                                            <br />
                                            <Text
                                                type="secondary"
                                                style={{ fontSize: 12, fontStyle: "italic" }}
                                            >
                                                (Tài khoản ảo tự động của đơn này)
                                            </Text>
                                        </div>
                                    </Flex>
                                    <Flex justify="space-between" align="center">
                                        <Text type="secondary">Số tiền:</Text>
                                        <Text
                                            strong
                                            copyable={{
                                                text: String(payosData.amount),
                                                tooltips: ["Sao chép số tiền", "Đã chép"],
                                            }}
                                            style={{ color: "#cf1322", fontSize: 15 }}
                                        >
                                            {new Intl.NumberFormat("vi-VN").format(
                                                payosData.amount,
                                            )}
                                            ₫
                                        </Text>
                                    </Flex>
                                    <Flex
                                        justify="space-between"
                                        align="center"
                                        style={{
                                            background: "#e6f4ff",
                                            padding: "8px 12px",
                                            borderRadius: 8,
                                            marginTop: 8,
                                        }}
                                    >
                                        <Text type="secondary" style={{ color: "#1677ff" }}>
                                            Nội dung CK:
                                        </Text>
                                        <Text
                                            strong
                                            copyable={{
                                                tooltips: ["Sao chép nội dung", "Đã chép"],
                                            }}
                                            style={{ color: "#1677ff", fontSize: 16 }}
                                        >
                                            {payosData.description}
                                        </Text>
                                    </Flex>
                                </Flex>
                            </div>
                            <Button
                                type="link"
                                icon={<LinkOutlined />}
                                href={payosData.checkoutUrl}
                                target="_blank"
                            >
                                Hoặc mở trang thanh toán gốc của PayOS
                            </Button>
                        </Flex>
                    ) : (
                        <Flex vertical align="center" style={{ padding: 40 }}>
                            <Spin />{" "}
                            <Text type="secondary" style={{ marginTop: 12 }}>
                                Đang khởi tạo mã bảo mật...
                            </Text>
                        </Flex>
                    )}
                </div>
                <Flex vertical gap="small" style={{ width: "100%" }}>
                    <Button
                        type="primary"
                        block
                        size="large"
                        loading={checkingPayment}
                        onClick={handleCheckPayment}
                        icon={<ReloadOutlined />}
                    >
                        Tôi đã chuyển khoản xong
                    </Button>
                    <Button type="text" block size="large" onClick={handleCancelPayment} danger>
                        Hủy thanh toán đơn này
                    </Button>
                </Flex>
            </Flex>
        </Modal>
    );
}
