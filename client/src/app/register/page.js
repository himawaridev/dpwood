// src/app/register/page.js
"use client";
import { Form, Input, Button, Card, message, Typography } from "antd";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/utils/axios";

const { Title } = Typography;

export default function RegisterPage() {
    const router = useRouter();

    const onFinish = async (values) => {
        try {
            const response = await api.post("/auth/register", values);
            message.success(
                response.data?.message || "Đăng ký thành công! Vui lòng kiểm tra email.",
            );
            router.push("/login"); // Chuyển về trang đăng nhập
        } catch (error) {
            message.error(error.response?.data?.message || "Đăng ký thất bại!");
        }
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                background: "#f0f2f5",
                padding: "40px 0",
            }}
        >
            <Card style={{ width: 450, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                <Title level={3} style={{ textAlign: "center", marginBottom: 24 }}>
                    Đăng Ký Tài Khoản
                </Title>
                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item
                        label="Họ và tên"
                        name="name"
                        rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
                    >
                        <Input size="large" placeholder="Nguyễn Văn A" />
                    </Form.Item>

                    <Form.Item
                        label="Username"
                        name="username"
                        rules={[{ required: true, message: "Vui lòng nhập username!" }]}
                    >
                        <Input size="large" placeholder="nguyenvana" />
                    </Form.Item>

                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[{ required: true, type: "email", message: "Email không hợp lệ!" }]}
                    >
                        <Input size="large" placeholder="email@example.com" />
                    </Form.Item>

                    <Form.Item
                        label="Số điện thoại"
                        name="phone"
                        rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}
                    >
                        <Input size="large" placeholder="0912345678" />
                    </Form.Item>

                    <Form.Item
                        label="Mật khẩu"
                        name="password"
                        rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
                    >
                        <Input.Password size="large" placeholder="Nhập mật khẩu" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" size="large" block>
                            Đăng Ký
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: "center" }}>
                        Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
