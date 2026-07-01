import React from "react";
import { Card, Result, Button, Space } from "antd";
import { HomeOutlined, ProfileOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

export default function SuccessResult({ orderCode }) {
    const router = useRouter();

    return (
        <div className="dp-page" style={{ display: "grid", placeItems: "center" }}>
            <Card className="dp-panel" style={{ maxWidth: 620, width: "100%" }}>
                <Result
                    status="success"
                    title="Đặt hàng thành công"
                    subTitle={`Mã đơn hàng: #${orderCode}. Hóa đơn điện tử sẽ được gửi về email tài khoản của bạn.`}
                    extra={
                        <Space wrap>
                            <Button
                                type="primary"
                                icon={<HomeOutlined />}
                                onClick={() => router.push("/")}
                                size="large"
                            >
                                Về trang chủ
                            </Button>
                            <Button
                                icon={<ProfileOutlined />}
                                onClick={() => router.push("/profile")}
                                size="large"
                            >
                                Xem đơn hàng
                            </Button>
                        </Space>
                    }
                />
            </Card>
        </div>
    );
}
