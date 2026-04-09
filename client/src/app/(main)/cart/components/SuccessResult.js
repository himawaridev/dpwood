import React from "react";
import { Card, Result, Button } from "antd";
import { useRouter } from "next/navigation";

export default function SuccessResult({ orderCode }) {
    const router = useRouter();

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "60vh",
                background: "#f0f2f5",
            }}
        >
            <Card style={{ borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
                <Result
                    status="success"
                    title="Đặt hàng thành công!"
                    subTitle={`Mã đơn hàng: #${orderCode}. Hóa đơn điện tử sẽ được gửi về email của bạn.`}
                    extra={[
                        <Button
                            type="primary"
                            key="home"
                            onClick={() => router.push("/")}
                            size="large"
                        >
                            Về trang chủ
                        </Button>,
                        <Button key="buy" onClick={() => router.push("/profile")} size="large">
                            Xem đơn hàng
                        </Button>,
                    ]}
                />
            </Card>
        </div>
    );
}
