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
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        if (window.location.hostname === "127.0.0.1") {
            const { protocol, port, pathname, search, hash } = window.location;
            window.location.replace(`${protocol}//localhost${port ? `:${port}` : ""}${pathname}${search}${hash}`);
        }
    }, []);

    useEffect(() => {
        if (resendCooldown <= 0) return undefined;

        const timerId = window.setInterval(() => {
            setResendCooldown((current) => Math.max(0, current - 1));
        }, 1000);

        return () => window.clearInterval(timerId);
    }, [resendCooldown]);

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
            setUnverifiedLogin("");
            setResendCooldown(0);
            const response = await api.post("/auth/login", {
                login: values.login,
                password: values.password,
            });
            handleLoginSuccess(response.data);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.";
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
            setResendCooldown(Number(response.data?.retryAfter || 60));
            message.success(response.data?.message || "Đã gửi lại email xác minh.");
        } catch (error) {
            const retryAfter = Number(error.response?.data?.retryAfter || 0);
            if (retryAfter > 0) setResendCooldown(retryAfter);
            message.error(error.response?.data?.message || "Không thể gửi lại email xác minh.");
        } finally {
            setResendingVerification(false);
        }
    };

    const onGoogleSuccess = async (credentialResponse) => {
        try {
            const response = await api.post("/auth/google", { token: credentialResponse.credential });
            handleLoginSuccess(response.data);
        } catch (error) {
            message.error(error.response?.data?.message || "Đăng nhập bằng Google thất bại.");
        }
    };

    return (
        <div className="dp-page dp-auth-page">
            <div className="dp-container dp-auth-layout dp-auth-shell">
                <aside className="dp-auth-aside">
                    <div className="dp-auth-brand-mark">
                        <Image src="/logo.png" alt="DPWOOD" width={40} height={40} priority />
                    </div>
                    <span className="dp-eyebrow">Tài khoản DPWOOD</span>
                    <Title className="dp-auth-aside-title">Tiếp tục mua sắm và theo dõi đơn hàng</Title>
                    <Paragraph className="dp-auth-aside-copy">
                        Đăng nhập để lưu địa chỉ, sử dụng kho mã giảm giá, theo dõi đơn hàng và thanh toán nhanh hơn.
                    </Paragraph>

                    <div className="dp-auth-benefits">
                        <div>
                            <ShoppingCartOutlined />
                            <span>Giỏ hàng và mã ưu đãi được đồng bộ</span>
                        </div>
                        <div>
                            <SafetyCertificateOutlined />
                            <span>Phiên đăng nhập và thanh toán được bảo vệ</span>
                        </div>
                    </div>
                </aside>

                <Card variant="borderless" className="dp-auth-card">
                    <div className="dp-auth-heading">
                        <span className="dp-eyebrow">Chào mừng trở lại</span>
                        <Title level={2}>Đăng nhập</Title>
                        <Text className="dp-muted">Chào mừng bạn quay lại DPWOOD.</Text>
                    </div>

                    <Form layout="vertical" onFinish={onFinish} className="dp-auth-form">
                        {unverifiedLogin && (
                            <Alert
                                type="warning"
                                showIcon
                                title="Tài khoản chưa xác minh email"
                                description={
                                    <div className="dp-auth-verify-alert">
                                        <span>
                                            Kiểm tra hộp thư đến, thư rác/quảng cáo hoặc bấm gửi lại email xác minh.
                                        </span>
                                        <Button
                                            size="small"
                                            type="primary"
                                            loading={resendingVerification}
                                            disabled={resendCooldown > 0}
                                            onClick={handleResendVerification}
                                        >
                                            {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : "Gửi lại email"}
                                        </Button>
                                    </div>
                                }
                            />
                        )}

                        <Form.Item
                            label="Tài khoản"
                            name="login"
                            rules={[{ required: true, message: "Vui lòng nhập tài khoản" }]}
                        >
                            <Input
                                size="large"
                                prefix={<MailOutlined />}
                                placeholder="Email, tên đăng nhập hoặc số điện thoại"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Mật khẩu"
                            name="password"
                            rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
                        >
                            <Input.Password size="large" prefix={<LockOutlined />} placeholder="Nhập mật khẩu" />
                        </Form.Item>

                        <div className="dp-auth-links-row">
                            <span />
                            <Link href="/forgot-password">Quên mật khẩu?</Link>
                        </div>

                        <Button type="primary" htmlType="submit" size="large" block icon={<LoginOutlined />}>
                            Đăng nhập
                        </Button>

                        <Divider plain>Hoặc đăng nhập bằng</Divider>

                        {googleClientId ? (
                            <GoogleOAuthProvider clientId={googleClientId}>
                                <div className="dp-auth-google">
                                    <GoogleLogin
                                        onSuccess={onGoogleSuccess}
                                        onError={() => message.error("Đăng nhập bằng Google thất bại")}
                                        ux_mode="popup"
                                        use_fedcm_for_button={false}
                                        text="signin_with"
                                        shape="rectangular"
                                    />
                                </div>
                            </GoogleOAuthProvider>
                        ) : (
                            <Text type="secondary" className="dp-auth-note">
                                Chưa cấu hình mã ứng dụng Google.
                            </Text>
                        )}

                        <div className="dp-auth-switch">
                            Chưa có tài khoản? <Link href="/register">Đăng ký ngay</Link>
                        </div>
                    </Form>
                </Card>
            </div>
        </div>
    );
}
