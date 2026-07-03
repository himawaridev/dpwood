"use client";

import { useEffect, useState } from "react";
import { Alert, App, Button, Card, Divider, Form, Input, Typography } from "antd";
import {
    LockOutlined,
    LoginOutlined,
    MailOutlined,
    SafetyCertificateOutlined,
    ShoppingCartOutlined,
} from "@ant-design/icons";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import api from "@/utils/axios";

const { Title, Text, Paragraph } = Typography;
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function LoginPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const [unverifiedLogin, setUnverifiedLogin] = useState("");
    const [resendingVerification, setResendingVerification] = useState(false);

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

        message.success("Dang nhap thanh cong.");
        router.push("/");
    };

    const onFinish = async (values) => {
        try {
            setUnverifiedLogin("");
            const response = await api.post("/auth/login", {
                login: values.login,
                password: values.password,
            });
            handleLoginSuccess(response.data);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Dang nhap that bai. Vui long thu lai.";
            if (error.response?.status === 403 && /verified|activate|xac minh|kích hoạt/i.test(errorMessage)) {
                setUnverifiedLogin(values.login);
            }
            message.error(errorMessage);
        }
    };

    const handleResendVerification = async () => {
        if (!unverifiedLogin) return;

        try {
            setResendingVerification(true);
            const response = await api.post("/auth/resend-verification", { login: unverifiedLogin });
            message.success(response.data?.message || "Da gui lai email xac minh.");
        } catch (error) {
            message.error(error.response?.data?.message || "Khong the gui lai email xac minh.");
        } finally {
            setResendingVerification(false);
        }
    };

    const onGoogleSuccess = async (credentialResponse) => {
        try {
            const response = await api.post("/auth/google", { token: credentialResponse.credential });
            handleLoginSuccess(response.data);
        } catch (error) {
            message.error(error.response?.data?.message || "Dang nhap Google that bai.");
        }
    };

    return (
        <div className="dp-page dp-auth-page">
            <div className="dp-container dp-auth-layout dp-auth-shell">
                <aside className="dp-auth-aside">
                    <div className="dp-auth-brand-mark">
                        <Image src="/logo.png" alt="DPWOOD" width={40} height={40} priority />
                    </div>
                    <span className="dp-eyebrow">DPWOOD account</span>
                    <Title className="dp-auth-aside-title">Tiep tuc mua sam va theo doi don hang</Title>
                    <Paragraph className="dp-auth-aside-copy">
                        Dang nhap de luu dia chi, su dung kho ma giam gia, theo doi don hang va thanh toan nhanh hon.
                    </Paragraph>

                    <div className="dp-auth-benefits">
                        <div>
                            <ShoppingCartOutlined />
                            <span>Gio hang va ma uu dai duoc dong bo</span>
                        </div>
                        <div>
                            <SafetyCertificateOutlined />
                            <span>Phien dang nhap va thanh toan duoc bao ve</span>
                        </div>
                    </div>
                </aside>

                <Card variant="borderless" className="dp-auth-card">
                    <div className="dp-auth-heading">
                        <span className="dp-eyebrow">Welcome back</span>
                        <Title level={2}>Dang nhap</Title>
                        <Text className="dp-muted">Chao mung ban quay lai DPWOOD.</Text>
                    </div>

                    <Form layout="vertical" onFinish={onFinish} className="dp-auth-form">
                        {unverifiedLogin && (
                            <Alert
                                type="warning"
                                showIcon
                                title="Tai khoan chua xac minh email"
                                description={
                                    <div className="dp-auth-verify-alert">
                                        <span>
                                            Kiem tra hop thu den, spam/quang cao hoac bam gui lai email xac minh.
                                        </span>
                                        <Button
                                            size="small"
                                            type="primary"
                                            loading={resendingVerification}
                                            onClick={handleResendVerification}
                                        >
                                            Gui lai email
                                        </Button>
                                    </div>
                                }
                            />
                        )}

                        <Form.Item
                            label="Tai khoan"
                            name="login"
                            rules={[{ required: true, message: "Vui long nhap tai khoan" }]}
                        >
                            <Input
                                size="large"
                                prefix={<MailOutlined />}
                                placeholder="Email, username hoac so dien thoai"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Mat khau"
                            name="password"
                            rules={[{ required: true, message: "Vui long nhap mat khau" }]}
                        >
                            <Input.Password size="large" prefix={<LockOutlined />} placeholder="Nhap mat khau" />
                        </Form.Item>

                        <div className="dp-auth-links-row">
                            <span />
                            <Link href="/forgot-password">Quen mat khau?</Link>
                        </div>

                        <Button type="primary" htmlType="submit" size="large" block icon={<LoginOutlined />}>
                            Dang nhap
                        </Button>

                        <Divider plain>Hoac dang nhap bang</Divider>

                        {googleClientId ? (
                            <GoogleOAuthProvider clientId={googleClientId}>
                                <div className="dp-auth-google">
                                    <GoogleLogin
                                        onSuccess={onGoogleSuccess}
                                        onError={() => message.error("Dang nhap Google that bai")}
                                        ux_mode="popup"
                                        use_fedcm_for_button={false}
                                        text="signin_with"
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
                            Chua co tai khoan? <Link href="/register">Dang ky ngay</Link>
                        </div>
                    </Form>
                </Card>
            </div>
        </div>
    );
}
