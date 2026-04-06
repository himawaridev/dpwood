// src/app/forgot-password/page.js
"use client";
import { Form, Input, Button, Card, message, Typography } from "antd";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/utils/axios";

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
    const router = useRouter();

    const onFinish = async (values) => {
        try {
            // Gửi đồng thời vào 3 trường để khớp với logic [Op.or] dưới Backend của bạn
            await api.post("/auth/forgot", {
                email: values.login,
                username: values.login,
                phone: values.login,
            });

            message.success("Đã gửi yêu cầu! Vui lòng kiểm tra email của bạn.");
            router.push("/login");
        } catch (error) {
            message.error(error.response?.data?.message || "Không tìm thấy tài khoản này!");
        }
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                background: "#f0f2f5",
            }}
        >
            <Card style={{ width: 400, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                <Title level={3} style={{ textAlign: "center", marginBottom: 8 }}>
                    Quên Mật Khẩu
                </Title>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <Text type="secondary">Nhập tài khoản của bạn để nhận liên kết khôi phục</Text>
                </div>

                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item
                        label="Email / Username / SĐT"
                        name="login"
                        rules={[{ required: true, message: "Vui lòng nhập thông tin!" }]}
                    >
                        <Input size="large" placeholder="Nhập tài khoản đã đăng ký" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" size="large" block>
                            Gửi liên kết khôi phục
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: "center" }}>
                        <Link href="/login">Quay lại đăng nhập</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
