// src/app/register/page.js
"use client";
import { Form, Input, Button, Card, message, Typography } from "antd";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/utils/axios";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

const { Title, Text } = Typography;

export default function RegisterPage() {
    const router = useRouter();

    const handleLoginSuccess = (data) => {
        localStorage.setItem("token", data.token);
        if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("userRole", data.user.role);
        if (data.user.avatarUrl) {
            localStorage.setItem("avatarUrl", data.user.avatarUrl);
        } else {
            localStorage.removeItem("avatarUrl");
        }
        message.success("Đăng ký & Đăng nhập thành công!");
        router.push("/");
    };

    const onFinish = async (values) => {
        try {
            const response = await api.post("/auth/register", values);
            message.success(
                response.data?.message || "Đăng ký thành công! Vui lòng kiểm tra email.",
            );
            router.push("/login");
        } catch (error) {
            message.error(error.response?.data?.message || "Đăng ký thất bại!");
        }
    };

    const onGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await api.post("/auth/google", { token: credentialResponse.credential });
            handleLoginSuccess(res.data);
        } catch (error) {
            message.error(error.response?.data?.message || "Google OAuth thất bại.");
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

                    <div style={{ textAlign: "center", marginBottom: "16px" }}>
                        <Text type="secondary">Hoặc đăng ký nhanh bằng</Text>
                    </div>

                    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "GOCSPX-placeholder"}>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                            <GoogleLogin
                                onSuccess={onGoogleSuccess}
                                onError={() => message.error("Google OAuth thất bại")}
                                useOneTap
                            />
                        </div>
                    </GoogleOAuthProvider>

                    <div style={{ textAlign: "center" }}>
                        Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
