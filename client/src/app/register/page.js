"use client";

import { useEffect, useState } from "react";
import { App, Button, Card, Divider, Form, Input, Typography } from "antd";
import { LockOutlined, MailOutlined, PhoneOutlined, UserAddOutlined, UserOutlined } from "@ant-design/icons";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import api from "@/utils/axios";
import { waitForAuthLoading } from "@/utils/authLoading";

const { Title, Text, Paragraph } = Typography;
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function RegisterPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [googleSubmitting, setGoogleSubmitting] = useState(false);

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
            const response = await api.post("/auth/google", { token: credentialResponse.credential });
            handleLoginSuccess(response.data);
        } catch (error) {
            await waitForAuthLoading(startedAt);
            message.error(error.response?.data?.message || "Đăng ký bằng Google thất bại.");
            setGoogleSubmitting(false);
        }
    };

    return (
        <div className="dp-page dp-auth-page">
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

                    <Form layout="vertical" onFinish={onFinish} className="dp-auth-form" disabled={submitting || googleSubmitting}>
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

                        {googleClientId ? (
                            <GoogleOAuthProvider clientId={googleClientId}>
                                <div className="dp-auth-google">
                                    <GoogleLogin
                                        onSuccess={onGoogleSuccess}
                                        onError={() => message.error("Đăng ký bằng Google thất bại")}
                                        ux_mode="popup"
                                        use_fedcm_for_button={false}
                                        text="signup_with"
                                        shape="rectangular"
                                    />
                                    {googleSubmitting && <Text className="dp-auth-note">Đang xác thực tài khoản Google...</Text>}
                                </div>
                            </GoogleOAuthProvider>
                        ) : (
                            <Text type="secondary" className="dp-auth-note">
                                Chưa cấu hình mã ứng dụng Google.
                            </Text>
                        )}

                        <div className="dp-auth-switch">
                            Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
                        </div>
                    </Form>
                </Card>
            </div>
        </div>
    );
}
