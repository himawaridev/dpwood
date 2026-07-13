import React, { useEffect, useMemo, useState } from "react";
import { Modal, Flex, Alert, Image, Divider, Typography, Button, Spin } from "antd";
import { ClockCircleOutlined, QrcodeOutlined, LinkOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function PaymentQRModal({
    isQrModalVisible,
    payosData,
    checkingPayment,
    cancelingPayment,
    handleCancelPayment,
}) {
    const expiresAt = useMemo(() => {
        const rawExpiry = payosData?.expiredAt || payosData?.expiresAt;
        if (!rawExpiry) return null;
        const numericExpiry = Number(rawExpiry);
        const timestamp = Number.isFinite(numericExpiry)
            ? numericExpiry < 1000000000000
                ? numericExpiry * 1000
                : numericExpiry
            : new Date(rawExpiry).getTime();
        return Number.isFinite(timestamp) ? timestamp : null;
    }, [payosData]);
    const [clock, setClock] = useState(() => Date.now());

    useEffect(() => {
        if (!isQrModalVisible || !expiresAt) return undefined;
        const intervalId = window.setInterval(() => setClock(Date.now()), 1000);
        return () => window.clearInterval(intervalId);
    }, [expiresAt, isQrModalVisible]);

    const remainingSeconds = expiresAt ? Math.max(0, Math.ceil((expiresAt - clock) / 1000)) : null;
    const isExpired = remainingSeconds === 0;
    const remainingLabel =
        remainingSeconds === null
            ? "10:00"
            : `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;

    return (
        <Modal
            title={
                <Flex gap="small" align="center">
                    <QrcodeOutlined style={{ color: "var(--dp-primary)" }} />
                    Thanh toán QR PayOS
                </Flex>
            }
            open={isQrModalVisible}
            footer={null}
            closable={false}
            maskClosable={false}
            centered
            width={500}
        >
            <Flex vertical align="center" gap={18}>
                <Alert
                    title="Hệ thống sẽ tự cập nhật khi PayOS xác nhận tiền"
                    description="Sau khi chuyển khoản thành công, modal sẽ tự đóng và chuyển bạn đến trang đơn hàng."
                    type="info"
                    showIcon
                    style={{ width: "100%" }}
                />

                <Text strong type={isExpired ? "danger" : undefined}>
                    <ClockCircleOutlined style={{ marginRight: 8 }} />
                    {isExpired
                        ? "Mã QR đã hết hạn, hệ thống đang cập nhật đơn hàng"
                        : `Mã QR còn hiệu lực ${remainingLabel}`}
                </Text>

                <div
                    style={{
                        padding: 16,
                        border: "1px solid var(--dp-soft-border)",
                        borderRadius: 8,
                        background: "#fff",
                        textAlign: "center",
                        width: "100%",
                    }}
                >
                    {payosData ? (
                        <Flex vertical align="center" gap="middle">
                            <Image
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payosData.qrCode || payosData.checkoutUrl || "")}`}
                                width={220}
                                preview={false}
                                alt="Mã QR thanh toán"
                            />

                            <Divider plain style={{ margin: "8px 0" }}>
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    Thông tin chuyển khoản
                                </Text>
                            </Divider>

                            <div
                                style={{
                                    background: "var(--dp-surface-muted)",
                                    padding: 16,
                                    borderRadius: 8,
                                    width: "100%",
                                    textAlign: "left",
                                }}
                            >
                                <Flex vertical gap="small">
                                    <Flex justify="space-between" align="center" gap={12}>
                                        <Text type="secondary">Ngân hàng</Text>
                                        <Text strong>
                                            {payosData.bin ? `Mã BIN: ${payosData.bin}` : "Theo mã QR"}
                                        </Text>
                                    </Flex>

                                    <Flex justify="space-between" align="center" gap={12}>
                                        <Text type="secondary">Chủ tài khoản</Text>
                                        <Text strong>{payosData.accountName || "PayOS"}</Text>
                                    </Flex>

                                    <Flex justify="space-between" align="center" gap={12}>
                                        <Text type="secondary">Số tài khoản</Text>
                                        <Text strong copyable={{ tooltips: ["Sao chép", "Đã chép"] }}>
                                            {payosData.accountNumber || "Theo mã QR"}
                                        </Text>
                                    </Flex>

                                    <Flex justify="space-between" align="center" gap={12}>
                                        <Text type="secondary">Số tiền</Text>
                                        <Text
                                            className="dp-price"
                                            copyable={{
                                                text: String(payosData.amount || ""),
                                                tooltips: ["Sao chép số tiền", "Đã chép"],
                                            }}
                                        >
                                            {new Intl.NumberFormat("vi-VN").format(payosData.amount || 0)}đ
                                        </Text>
                                    </Flex>

                                    <Flex
                                        justify="space-between"
                                        align="center"
                                        gap={12}
                                        style={{
                                            background: "#eaf7f4",
                                            padding: "8px 12px",
                                            borderRadius: 8,
                                            marginTop: 8,
                                        }}
                                    >
                                        <Text type="secondary">Nội dung</Text>
                                        <Text
                                            strong
                                            copyable={{ tooltips: ["Sao chép nội dung", "Đã chép"] }}
                                            style={{ color: "var(--dp-primary)" }}
                                        >
                                            {payosData.description}
                                        </Text>
                                    </Flex>
                                </Flex>
                            </div>

                            {payosData.checkoutUrl && (
                                <Button
                                    type="link"
                                    icon={<LinkOutlined />}
                                    href={payosData.checkoutUrl}
                                    target="_blank"
                                    disabled={isExpired}
                                >
                                    Mở trang thanh toán PayOS
                                </Button>
                            )}
                        </Flex>
                    ) : (
                        <Flex vertical align="center" style={{ padding: 40 }}>
                            <Spin />
                            <Text type="secondary" style={{ marginTop: 12 }}>
                                Đang khởi tạo mã thanh toán...
                            </Text>
                        </Flex>
                    )}
                </div>

                <Flex vertical gap="small" style={{ width: "100%" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 10,
                            minHeight: 44,
                            border: "1px solid var(--dp-soft-border)",
                            background: "var(--dp-surface-muted)",
                        }}
                    >
                        <Spin size="small" spinning={checkingPayment} />
                        <Text strong>Đang tự động xác nhận thanh toán</Text>
                    </div>

                    <Button
                        type="text"
                        block
                        size="large"
                        onClick={handleCancelPayment}
                        loading={cancelingPayment}
                        disabled={cancelingPayment}
                        danger
                    >
                        Hủy thanh toán đơn này
                    </Button>
                </Flex>
            </Flex>
        </Modal>
    );
}
