"use client";

import { useEffect } from "react";
import { App, Button, Card, Divider, Form, Input, Space, Typography } from "antd";
import { LoginOutlined, SafetyCertificateOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/utils/axios";

const { Title, Text, Paragraph } = Typography;
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function LoginPage() {
    const { message } = App.useApp();
    const router = useRouter();

    useEffect(() => {
        if (window.location.hostname === "127.0.0.1") {
            const { protocol, port, pathname, search, hash } = window.location;
            window.location.replace(`${protocol}//localhost${port ? `:${port}` : ""}${pathname}${search}${hash}`);
        }
    }, []);

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

        message.success("Đăng nhập thành công.");
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
            const response = await api.post("/auth/google", { token: credentialResponse.credential });
            handleLoginSuccess(response.data);
        } catch (error) {
            message.error(error.response?.data?.message || "Đăng nhập Google thất bại.");
        }
    };

    return (
        <div className="dp-page" style={{ display: "grid", placeItems: "center" }}>
            <div
                className="dp-container dp-panel dp-auth-layout"
                style={{
                    maxWidth: 980,
                    display: "grid",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        padding: "48px clamp(24px, 5vw, 52px)",
                        background: "#10231e",
                        color: "#fff",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                    }}
                >
                    <span className="dp-eyebrow" style={{ color: "#7dd3c7" }}>
                        DPWOOD account
                    </span>
                    <Title style={{ color: "#fff", margin: "10px 0", lineHeight: 1.15 }}>
                        Tiếp tục mua sắm và theo dõi đơn hàng
                    </Title>
                    <Paragraph style={{ color: "rgba(255,255,255,0.72)", marginBottom: 24 }}>
                        Đăng nhập để lưu địa chỉ, xem lịch sử đơn hàng và thanh toán nhanh hơn.
                    </Paragraph>
                    <Space orientation="vertical" size={12}>
                        <Text style={{ color: "rgba(255,255,255,0.82)" }}>
                            <ShoppingCartOutlined /> Giỏ hàng và đơn hàng được đồng bộ
                        </Text>
                        <Text style={{ color: "rgba(255,255,255,0.82)" }}>
                            <SafetyCertificateOutlined /> Bảo vệ tài khoản và phiên thanh toán
                        </Text>
                    </Space>
                </div>

                <Card variant="borderless" style={{ boxShadow: "none", borderRadius: 0 }}>
                    <Title level={3} style={{ marginBottom: 8 }}>
                        Đăng nhập
                    </Title>
                    <Text className="dp-muted">Chào mừng bạn quay lại DPWOOD.</Text>

                    <Form layout="vertical" onFinish={onFinish} style={{ marginTop: 24 }}>
                        <Form.Item
                            label="Tài khoản"
                            name="login"
                            rules={[{ required: true, message: "Vui lòng nhập tài khoản" }]}
                        >
                            <Input size="large" placeholder="Email, username hoặc số điện thoại" />
                        </Form.Item>

                        <Form.Item
                            label="Mật khẩu"
                            name="password"
                            rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
                        >
                            <Input.Password size="large" placeholder="Nhập mật khẩu" />
                        </Form.Item>

                        <Button type="primary" htmlType="submit" size="large" block icon={<LoginOutlined />}>
                            Đăng nhập
                        </Button>

                        <Divider plain>Hoặc đăng nhập bằng</Divider>

                        {googleClientId ? (
                            <GoogleOAuthProvider clientId={googleClientId}>
                                <div style={{ display: "flex", justifyContent: "center" }}>
                                    <GoogleLogin
                                        onSuccess={onGoogleSuccess}
                                        onError={() => message.error("Đăng nhập Google thất bại")}
                                        ux_mode="popup"
                                        use_fedcm_for_button={false}
                                        text="signin_with"
                                        shape="rectangular"
                                    />
                                </div>
                            </GoogleOAuthProvider>
                        ) : (
                            <Text type="secondary" style={{ display: "block", textAlign: "center" }}>
                                Chưa cấu hình Google Client ID.
                            </Text>
                        )}

                        <div style={{ textAlign: "center", marginTop: 16 }}>
                            <Link href="/forgot-password">Quên mật khẩu?</Link>
                        </div>
                        <div style={{ textAlign: "center", marginTop: 8 }}>
                            Chưa có tài khoản? <Link href="/register">Đăng ký ngay</Link>
                        </div>
                    </Form>
                </Card>
            </div>
        </div>
    );
}
