"use client";

import { App, Button, Card, Form, Input, Typography } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/utils/axios";

const { Title, Text } = Typography;

export default function ResetPasswordPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const params = useParams();

    const onFinish = async (values) => {
        try {
            await api.post("/auth/reset", {
                token: params.token,
                password: values.password,
            });

            message.success("Đổi mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.");
            router.push("/login");
        } catch (error) {
            message.error(error.response?.data?.message || "Liên kết đã hết hạn hoặc không hợp lệ.");
        }
    };

    return (
        <div className="dp-page" style={{ display: "grid", placeItems: "center" }}>
            <Card className="dp-panel" style={{ width: "min(100%, 440px)" }}>
                <Title level={3} style={{ marginBottom: 8 }}>
                    Tạo mật khẩu mới
                </Title>
                <Text className="dp-muted">Nhập mật khẩu mới để tiếp tục sử dụng tài khoản DPWOOD.</Text>

                <Form layout="vertical" onFinish={onFinish} style={{ marginTop: 24 }}>
                    <Form.Item
                        label="Mật khẩu mới"
                        name="password"
                        rules={[{ required: true, message: "Vui lòng nhập mật khẩu mới" }]}
                    >
                        <Input.Password size="large" placeholder="Nhập mật khẩu mới" />
                    </Form.Item>

                    <Form.Item
                        label="Xác nhận mật khẩu"
                        name="confirmPassword"
                        dependencies={["password"]}
                        rules={[
                            { required: true, message: "Vui lòng xác nhận mật khẩu" },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue("password") === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error("Mật khẩu xác nhận không khớp"));
                                },
                            }),
                        ]}
                    >
                        <Input.Password size="large" placeholder="Nhập lại mật khẩu" />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" size="large" block icon={<LockOutlined />}>
                        Xác nhận đổi mật khẩu
                    </Button>

                    <div style={{ textAlign: "center", marginTop: 16 }}>
                        <Link href="/login">Quay lại đăng nhập</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
