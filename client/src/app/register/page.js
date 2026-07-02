"use client";

import { useEffect } from "react";
import { App, Button, Card, Divider, Form, Input, Typography } from "antd";
import { LockOutlined, MailOutlined, PhoneOutlined, UserAddOutlined, UserOutlined } from "@ant-design/icons";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import api from "@/utils/axios";

const { Title, Text, Paragraph } = Typography;
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
        message.success("Dang ky va dang nhap thanh cong.");
        router.push("/");
    };

    const onFinish = async (values) => {
        try {
            const response = await api.post("/auth/register", values);
            message.success(response.data?.message || "Dang ky thanh cong. Vui long kiem tra email.");
            router.push("/login");
        } catch (error) {
            message.error(error.response?.data?.message || "Dang ky that bai.");
        }
    };

    const onGoogleSuccess = async (credentialResponse) => {
        try {
            const response = await api.post("/auth/google", { token: credentialResponse.credential });
            handleLoginSuccess(response.data);
        } catch (error) {
            message.error(error.response?.data?.message || "Google OAuth that bai.");
        }
    };

    return (
        <div className="dp-page dp-auth-page">
            <div className="dp-container dp-auth-register-shell">
                <section className="dp-auth-register-intro">
                    <div className="dp-auth-brand-mark">
                        <Image src="/logo.png" alt="DPWOOD" width={40} height={40} priority />
                    </div>
                    <span className="dp-eyebrow">Create account</span>
                    <Title level={1}>Tao tai khoan DPWOOD</Title>
                    <Paragraph>
                        Luu dia chi giao hang, nhan ma giam gia, theo doi don hang va danh gia san pham da mua.
                    </Paragraph>
                </section>

                <Card variant="borderless" className="dp-auth-card dp-auth-register-card">
                    <div className="dp-auth-heading">
                        <span className="dp-eyebrow">Join DPWOOD</span>
                        <Title level={2}>Dang ky</Title>
                        <Text className="dp-muted">Hoan tat thong tin de tao tai khoan mua sam.</Text>
                    </div>

                    <Form layout="vertical" onFinish={onFinish} className="dp-auth-form">
                        <div className="dp-auth-register-grid">
                            <Form.Item
                                label="Ho va ten"
                                name="name"
                                rules={[{ required: true, message: "Vui long nhap ho ten" }]}
                            >
                                <Input size="large" prefix={<UserOutlined />} placeholder="Nguyen Van A" />
                            </Form.Item>

                            <Form.Item
                                label="Username"
                                name="username"
                                rules={[{ required: true, message: "Vui long nhap username" }]}
                            >
                                <Input size="large" prefix={<UserOutlined />} placeholder="nguyenvana" />
                            </Form.Item>

                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[{ required: true, type: "email", message: "Email khong hop le" }]}
                            >
                                <Input size="large" prefix={<MailOutlined />} placeholder="email@example.com" />
                            </Form.Item>

                            <Form.Item
                                label="So dien thoai"
                                name="phone"
                                rules={[
                                    { required: true, message: "Vui long nhap so dien thoai" },
                                    {
                                        pattern: /^[0-9]{10,11}$/,
                                        message: "So dien thoai can co 10-11 chu so",
                                    },
                                ]}
                            >
                                <Input size="large" prefix={<PhoneOutlined />} placeholder="0912345678" />
                            </Form.Item>
                        </div>

                        <Form.Item
                            label="Mat khau"
                            name="password"
                            rules={[
                                { required: true, message: "Vui long nhap mat khau" },
                                { min: 6, message: "Mat khau can it nhat 6 ky tu" },
                            ]}
                        >
                            <Input.Password size="large" prefix={<LockOutlined />} placeholder="Nhap mat khau" />
                        </Form.Item>

                        <Button type="primary" htmlType="submit" size="large" block icon={<UserAddOutlined />}>
                            Dang ky
                        </Button>

                        <Divider plain>Hoac dang ky nhanh bang</Divider>

                        {googleClientId ? (
                            <GoogleOAuthProvider clientId={googleClientId}>
                                <div className="dp-auth-google">
                                    <GoogleLogin
                                        onSuccess={onGoogleSuccess}
                                        onError={() => message.error("Google OAuth that bai")}
                                        ux_mode="popup"
                                        use_fedcm_for_button={false}
                                        text="signup_with"
                                        shape="rectangular"
                                    />
                                </div>
                            </GoogleOAuthProvider>
                        ) : (
                            <Text type="secondary" className="dp-auth-note">
                                Chua cau hinh Google Client ID.
                            </Text>
                        )}

                        <div className="dp-auth-switch">
                            Da co tai khoan? <Link href="/login">Dang nhap</Link>
                        </div>
                    </Form>
                </Card>
            </div>
        </div>
    );
}
