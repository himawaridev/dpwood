"use client";

import { App, Form, Input, Button, Card, Typography } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/utils/axios";

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
    const { message } = App.useApp();
    const router = useRouter();

    const onFinish = async (values) => {
        try {
            await api.post("/auth/forgot", {
                email: values.login,
                username: values.login,
                phone: values.login,
            });

            message.success("Đã gửi yêu cầu. Vui lòng kiểm tra email của bạn.");
            router.push("/login");
        } catch (error) {
            message.error(error.response?.data?.message || "Không tìm thấy tài khoản này.");
        }
    };

    return (
        <div className="dp-page" style={{ display: "grid", placeItems: "center" }}>
            <Card className="dp-panel" style={{ width: "min(100%, 440px)" }}>
                <Title level={3} style={{ marginBottom: 8 }}>
                    Khôi phục mật khẩu
                </Title>
                <Text className="dp-muted">Nhập tài khoản đã đăng ký để nhận liên kết khôi phục.</Text>

                <Form layout="vertical" onFinish={onFinish} style={{ marginTop: 24 }}>
                    <Form.Item
                        label="Email / Tên đăng nhập / Số điện thoại"
                        name="login"
                        rules={[{ required: true, message: "Vui lòng nhập thông tin" }]}
                    >
                        <Input size="large" placeholder="Nhập tài khoản đã đăng ký" />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" size="large" block icon={<MailOutlined />}>
                        Gửi liên kết khôi phục
                    </Button>

                    <div style={{ textAlign: "center", marginTop: 16 }}>
                        <Link href="/login">Quay lại đăng nhập</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
