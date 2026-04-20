// src/app/login/page.js
"use client";
import { Form, Input, Button, Card, message, Typography } from "antd";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/utils/axios";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

const { Title, Text } = Typography;

export default function LoginPage() {
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
        message.success("Đăng nhập thành công!");
        router.push("/");
    };

    const onFinish = async (values) => {
        try {
            const response = await api.post("/auth/login", {
                login: values.login,
                password: values.password,
            });
            handleLoginSuccess(response.data);
        } catch (error) {
            message.error(error.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
        }
    };

    const onGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await api.post("/auth/google", { token: credentialResponse.credential });
            handleLoginSuccess(res.data);
        } catch (error) {
            message.error(error.response?.data?.message || "Đăng nhập Google thất bại.");
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
                        <Input size="large" placeholder="Nhập email, username" />
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

                    <div style={{ textAlign: "center", marginBottom: "16px" }}>
                        <Text type="secondary">Hoặc đăng nhập bằng</Text>
                    </div>

                    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "GOCSPX-placeholder"}>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                            <GoogleLogin
                                onSuccess={onGoogleSuccess}
                                onError={() => message.error("Đăng nhập Google thất bại")}
                                useOneTap
                            />
                        </div>
                    </GoogleOAuthProvider>

                    <div style={{ textAlign: "center", marginTop: 10 }}>
                        <Link href="/forgot-password">Quên mật khẩu?</Link>
                    </div>
                    <div style={{ textAlign: "center", marginTop: 10 }}>
                        Chưa có tài khoản? <Link href="/register">Đăng ký ngay</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
