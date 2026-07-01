"use client";

import { useEffect } from "react";
import { App, Button, Card, Divider, Form, Input, Typography } from "antd";
import { UserAddOutlined } from "@ant-design/icons";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/utils/axios";

const { Title, Text } = Typography;
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function RegisterPage() {
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
        message.success("Đăng ký và đăng nhập thành công.");
        router.push("/");
    };

    const onFinish = async (values) => {
        try {
            const response = await api.post("/auth/register", values);
            message.success(response.data?.message || "Đăng ký thành công. Vui lòng kiểm tra email.");
            router.push("/login");
        } catch (error) {
            message.error(error.response?.data?.message || "Đăng ký thất bại.");
        }
    };

    const onGoogleSuccess = async (credentialResponse) => {
        try {
            const response = await api.post("/auth/google", { token: credentialResponse.credential });
            handleLoginSuccess(response.data);
        } catch (error) {
            message.error(error.response?.data?.message || "Google OAuth thất bại.");
        }
    };

    return (
        <div className="dp-page" style={{ display: "grid", placeItems: "center" }}>
            <Card className="dp-panel" style={{ width: "min(100%, 500px)" }}>
                <Title level={3} style={{ marginBottom: 8 }}>
                    Tạo tài khoản DPWOOD
                </Title>
                <Text className="dp-muted">Lưu địa chỉ, theo dõi đơn hàng và nhận ưu đãi mới.</Text>
                <Form layout="vertical" onFinish={onFinish} style={{ marginTop: 24 }}>
                    <Form.Item
                        label="Họ và tên"
                        name="name"
                        rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                    >
                        <Input size="large" placeholder="Nguyễn Văn A" />
                    </Form.Item>
                    <Form.Item
                        label="Username"
                        name="username"
                        rules={[{ required: true, message: "Vui lòng nhập username" }]}
                    >
                        <Input size="large" placeholder="nguyenvana" />
                    </Form.Item>
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[{ required: true, type: "email", message: "Email không hợp lệ" }]}
                    >
                        <Input size="large" placeholder="email@example.com" />
                    </Form.Item>
                    <Form.Item
                        label="Số điện thoại"
                        name="phone"
                        rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
                    >
                        <Input size="large" placeholder="0912345678" />
                    </Form.Item>
                    <Form.Item
                        label="Mật khẩu"
                        name="password"
                        rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
                    >
                        <Input.Password size="large" placeholder="Nhập mật khẩu" />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" size="large" block icon={<UserAddOutlined />}>
                        Đăng ký
                    </Button>

                    <Divider plain>Hoặc đăng ký nhanh bằng</Divider>

                    {googleClientId ? (
                        <GoogleOAuthProvider clientId={googleClientId}>
                            <div style={{ display: "flex", justifyContent: "center" }}>
                                <GoogleLogin
                                    onSuccess={onGoogleSuccess}
                                    onError={() => message.error("Google OAuth thất bại")}
                                    ux_mode="popup"
                                    use_fedcm_for_button={false}
                                    text="signup_with"
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
                        Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
