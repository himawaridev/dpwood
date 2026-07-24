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
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import api from "@/utils/axios";
import { waitForAuthLoading } from "@/utils/authLoading";
import { persistAuthSession } from "@/utils/authSession";
import SocialAuthMethods from "@/components/auth/SocialAuthMethods";
import TwoFactorModal from "@/components/auth/TwoFactorModal";

const { Title, Text, Paragraph } = Typography;
const GOOGLE_AUTH_MESSAGE_KEY = "login-google-auth";
const TELEGRAM_AUTH_MESSAGE_KEY = "login-telegram-auth";

export default function LoginPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const [unverifiedLogin, setUnverifiedLogin] = useState("");
    const [resendingVerification, setResendingVerification] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [googleSubmitting, setGoogleSubmitting] = useState(false);
    const [telegramSubmitting, setTelegramSubmitting] = useState(false);
    const [twoFactorChallenge, setTwoFactorChallenge] = useState("");
    const [twoFactorCode, setTwoFactorCode] = useState("");
    const [twoFactorSubmitting, setTwoFactorSubmitting] = useState(false);

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

    const handleLoginSuccess = (data, messageKey) => {
        if (data?.requiresTwoFactor) {
            setTwoFactorChallenge(data.challengeToken);
            setTwoFactorCode("");
            message.info({
                content: data.message || "Vui lòng nhập mã xác thực đã gửi qua email.",
                ...(messageKey ? { key: messageKey } : {}),
            });
            return false;
        }
        persistAuthSession(data);
        message.success({
            content: "Đăng nhập thành công.",
            ...(messageKey ? { key: messageKey } : {}),
        });
        router.push("/");
        return true;
    };

    const verifyTwoFactorLogin = async () => {
        if (twoFactorSubmitting || twoFactorCode.length !== 6) return;
        try {
            setTwoFactorSubmitting(true);
            const response = await api.post("/auth/2fa/verify", {
                challengeToken: twoFactorChallenge,
                code: twoFactorCode,
            });
            setTwoFactorChallenge("");
            handleLoginSuccess(response.data);
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể xác thực mã đăng nhập.");
        } finally {
            setTwoFactorSubmitting(false);
        }
    };

    const onFinish = async (values) => {
        if (submitting) return;
        const startedAt = Date.now();

        try {
            setSubmitting(true);
            setUnverifiedLogin("");
            setResendCooldown(0);
            const response = await api.post("/auth/login", {
                login: values.login,
                password: values.password,
            });
            if (!handleLoginSuccess(response.data)) setSubmitting(false);
        } catch (error) {
            await waitForAuthLoading(startedAt);
            const errorMessage = error.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.";
            if (error.response?.status === 403 && /verified|activate|xac minh|kích hoạt/i.test(errorMessage)) {
                setUnverifiedLogin(values.login);
            }
            message.error(errorMessage);
            setSubmitting(false);
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
        if (googleSubmitting) return;
        const startedAt = Date.now();

        try {
            setGoogleSubmitting(true);
            message.loading({
                content: "Đang xác thực tài khoản Google...",
                key: GOOGLE_AUTH_MESSAGE_KEY,
                duration: 0,
            });
            const response = await api.post("/auth/google", { token: credentialResponse.credential });
            if (!handleLoginSuccess(response.data, GOOGLE_AUTH_MESSAGE_KEY)) {
                setGoogleSubmitting(false);
            }
        } catch (error) {
            await waitForAuthLoading(startedAt);
            message.error({
                content: error.response?.data?.message || "Đăng nhập bằng Google thất bại.",
                key: GOOGLE_AUTH_MESSAGE_KEY,
            });
            setGoogleSubmitting(false);
        }
    };

    const handleGoogleStart = () => {
        message.loading({
            content: "Đang mở cửa sổ xác thực Google...",
            key: GOOGLE_AUTH_MESSAGE_KEY,
            duration: 3,
        });
    };

    const handleGoogleError = () => {
        setGoogleSubmitting(false);
        message.error({
            content: "Đăng nhập bằng Google thất bại.",
            key: GOOGLE_AUTH_MESSAGE_KEY,
        });
    };

    const handleTelegramAuth = async (telegramUser) => {
        if (telegramSubmitting) return;
        const startedAt = Date.now();

        try {
            setTelegramSubmitting(true);
            message.loading({
                content: "Đang xác thực tài khoản Telegram...",
                key: TELEGRAM_AUTH_MESSAGE_KEY,
                duration: 0,
            });
            const response = await api.post("/auth/telegram", telegramUser);
            if (!handleLoginSuccess(response.data, TELEGRAM_AUTH_MESSAGE_KEY)) {
                setTelegramSubmitting(false);
            }
        } catch (error) {
            await waitForAuthLoading(startedAt);
            setTelegramSubmitting(false);
            message.error({
                content: error.response?.data?.message || "Đăng nhập bằng Telegram thất bại.",
                key: TELEGRAM_AUTH_MESSAGE_KEY,
            });
        }
    };

    const handleTelegramError = () => {
        setTelegramSubmitting(false);
        message.error({
            content: "Không thể tải Telegram Login Widget.",
            key: TELEGRAM_AUTH_MESSAGE_KEY,
        });
    };

    return (
        <div className="dp-page dp-auth-page">
            <TwoFactorModal
                open={Boolean(twoFactorChallenge)}
                value={twoFactorCode}
                loading={twoFactorSubmitting}
                onChange={setTwoFactorCode}
                onSubmit={verifyTwoFactorLogin}
                onCancel={() => {
                    setTwoFactorChallenge("");
                    setTwoFactorCode("");
                }}
            />
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

                    <Form
                        layout="vertical"
                        onFinish={onFinish}
                        className="dp-auth-form"
                        disabled={submitting || googleSubmitting || telegramSubmitting}
                    >
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

                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            block
                            icon={<LoginOutlined />}
                            loading={submitting}
                        >
                            {submitting ? "Đang đăng nhập" : "Đăng nhập"}
                        </Button>

                        <Divider plain>Hoặc đăng nhập bằng</Divider>

                        <SocialAuthMethods
                            mode="login"
                            googleSubmitting={googleSubmitting}
                            telegramSubmitting={telegramSubmitting}
                            onGoogleStart={handleGoogleStart}
                            onGoogleSuccess={onGoogleSuccess}
                            onGoogleError={handleGoogleError}
                            onTelegramAuth={handleTelegramAuth}
                            onTelegramError={handleTelegramError}
                        />

                        <div className="dp-auth-switch">
                            Chưa có tài khoản? <Link href="/register">Đăng ký ngay</Link>
                        </div>
                    </Form>
                </Card>
            </div>
        </div>
    );
}
