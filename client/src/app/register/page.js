"use client";

import { useEffect, useState } from "react";
import { App, Button, Card, Divider, Form, Input, Typography } from "antd";
import { LockOutlined, MailOutlined, PhoneOutlined, UserAddOutlined, UserOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import api from "@/utils/axios";
import { waitForAuthLoading } from "@/utils/authLoading";
import { persistAuthSession } from "@/utils/authSession";
import SocialAuthMethods from "@/components/auth/SocialAuthMethods";
import TwoFactorModal from "@/components/auth/TwoFactorModal";

const { Title, Text, Paragraph } = Typography;
const GOOGLE_AUTH_MESSAGE_KEY = "register-google-auth";
const TELEGRAM_AUTH_MESSAGE_KEY = "register-telegram-auth";

export default function RegisterPage() {
    const { message } = App.useApp();
    const router = useRouter();
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

    const handleLoginSuccess = (data, messageKey) => {
        if (data?.requiresTwoFactor) {
            setTwoFactorChallenge(data.challengeToken);
            message.info({
                content: data.message || "Vui lòng nhập mã xác thực đã gửi qua email.",
                ...(messageKey ? { key: messageKey } : {}),
            });
            return false;
        }
        persistAuthSession(data);
        message.success({
            content: "Đăng ký và đăng nhập thành công.",
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
            const response = await api.post("/auth/register", values);
            message.success(response.data?.message || "Đăng ký thành công. Vui lòng kiểm tra email.");
            router.push("/login");
        } catch (error) {
            await waitForAuthLoading(startedAt);
            message.error(error.response?.data?.message || "Đăng ký thất bại.");
            setSubmitting(false);
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
                content: error.response?.data?.message || "Đăng ký bằng Google thất bại.",
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
            content: "Đăng ký bằng Google thất bại.",
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
                content: error.response?.data?.message || "Đăng ký bằng Telegram thất bại.",
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
            <div className="dp-container dp-auth-register-shell">
                <section className="dp-auth-register-intro">
                    <div className="dp-auth-brand-mark">
                        <Image src="/logo.png" alt="DPWOOD" width={40} height={40} priority />
                    </div>
                    <span className="dp-eyebrow">Tạo tài khoản</span>
                    <Title level={1}>Tạo tài khoản DPWOOD</Title>
                    <Paragraph>
                        Lưu địa chỉ giao hàng, nhận mã giảm giá, theo dõi đơn hàng và đánh giá sản phẩm đã mua.
                    </Paragraph>
                </section>

                <Card variant="borderless" className="dp-auth-card dp-auth-register-card">
                    <div className="dp-auth-heading">
                        <span className="dp-eyebrow">Tham gia DPWOOD</span>
                        <Title level={2}>Đăng ký</Title>
                        <Text className="dp-muted">Hoàn tất thông tin để tạo tài khoản mua sắm.</Text>
                    </div>

                    <Form
                        layout="vertical"
                        onFinish={onFinish}
                        className="dp-auth-form"
                        disabled={submitting || googleSubmitting || telegramSubmitting}
                    >
                        <div className="dp-auth-register-grid">
                            <Form.Item
                                label="Họ và tên"
                                name="name"
                                rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                            >
                                <Input size="large" prefix={<UserOutlined />} placeholder="Nguyễn Văn A" />
                            </Form.Item>

                            <Form.Item
                                label="Tên đăng nhập"
                                name="username"
                                rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập" }]}
                            >
                                <Input size="large" prefix={<UserOutlined />} placeholder="nguyenvana" />
                            </Form.Item>

                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[{ required: true, type: "email", message: "Email không hợp lệ" }]}
                            >
                                <Input size="large" prefix={<MailOutlined />} placeholder="email@example.com" />
                            </Form.Item>

                            <Form.Item
                                label="Số điện thoại"
                                name="phone"
                                rules={[
                                    { required: true, message: "Vui lòng nhập số điện thoại" },
                                    {
                                        pattern: /^[0-9]{10,11}$/,
                                        message: "Số điện thoại cần có 10-11 chữ số",
                                    },
                                ]}
                            >
                                <Input size="large" prefix={<PhoneOutlined />} placeholder="0912345678" />
                            </Form.Item>
                        </div>

                        <Form.Item
                            label="Mật khẩu"
                            name="password"
                            rules={[
                                { required: true, message: "Vui lòng nhập mật khẩu" },
                                { min: 6, message: "Mật khẩu cần ít nhất 6 ký tự" },
                            ]}
                        >
                            <Input.Password size="large" prefix={<LockOutlined />} placeholder="Nhập mật khẩu" />
                        </Form.Item>

                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            block
                            icon={<UserAddOutlined />}
                            loading={submitting}
                        >
                            {submitting ? "Đang đăng ký" : "Đăng ký"}
                        </Button>

                        <Divider plain>Hoặc đăng ký nhanh bằng</Divider>

                        <SocialAuthMethods
                            mode="register"
                            googleSubmitting={googleSubmitting}
                            telegramSubmitting={telegramSubmitting}
                            onGoogleStart={handleGoogleStart}
                            onGoogleSuccess={onGoogleSuccess}
                            onGoogleError={handleGoogleError}
                            onTelegramAuth={handleTelegramAuth}
                            onTelegramError={handleTelegramError}
                        />

                        <div className="dp-auth-switch">
                            Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
                        </div>
                    </Form>
                </Card>
            </div>
        </div>
    );
}
