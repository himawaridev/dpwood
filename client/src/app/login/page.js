// src/app/login/page.js
"use client";
import { Form, Input, Button, Card, message, Typography } from "antd";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/utils/axios";

const { Title } = Typography;

export default function LoginPage() {
    const router = useRouter();

    const onFinish = async (values) => {
        try {
            // Gọi API đăng nhập (Backend đang nhận trường 'login' thay cho email/username)
            const response = await api.post("/auth/login", {
                login: values.login,
                password: values.password,
            });

            // Lưu token vào localStorage
            localStorage.setItem("token", response.data.token);
            if (response.data.refreshToken) {
                localStorage.setItem("refreshToken", response.data.refreshToken);
            }
            localStorage.setItem("userName", response.data.user.name);
            localStorage.setItem("userRole", response.data.user.role);
            if (response.data.user.avatarUrl) {
                localStorage.setItem("avatarUrl", response.data.user.avatarUrl);
            } else {
                localStorage.removeItem("avatarUrl"); // Xóa nếu không có để tránh dùng ảnh cũ của máy
            }

            message.success("Đăng nhập thành công!");
            router.push("/"); // Chuyển hướng về trang chủ
        } catch (error) {
            message.error(error.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
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
                <Title level={3} style={{ textAlign: "center", marginBottom: 24 }}>
                    Đăng Nhập
                </Title>
                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item
                        label="Tài khoản (Email/Username/SĐT)"
                        name="login"
                        rules={[{ required: true, message: "Vui lòng nhập tài khoản!" }]}
                    >
                        <Input size="large" placeholder="Nhập email, username hoặc số điện thoại" />
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
                            Đăng Nhập
                        </Button>
                    </Form.Item>
                    <div style={{ textAlign: "center" }}>
                        <Link href="/forgot-password">Quên mật khẩu?</Link>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        Chưa có tài khoản? <Link href="/register">Đăng ký ngay</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
