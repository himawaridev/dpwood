// src/app/reset/[token]/page.js
"use client";
import { Form, Input, Button, Card, message, Typography } from "antd";
import { useRouter, useParams } from "next/navigation";
import api from "@/utils/axios";

const { Title } = Typography;

export default function ResetPasswordPage() {
    const router = useRouter();
    const params = useParams(); // Lấy token từ thanh địa chỉ (URL)

    const onFinish = async (values) => {
        try {
            await api.post("/auth/reset", {
                token: params.token, // Truyền token xuống backend
                password: values.password,
            });

            message.success("Đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.");
            router.push("/login");
        } catch (error) {
            message.error(error.response?.data?.message || "Link đã hết hạn hoặc không hợp lệ.");
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
                    Tạo Mật Khẩu Mới
                </Title>
                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item
                        label="Mật khẩu mới"
                        name="password"
                        rules={[{ required: true, message: "Vui lòng nhập mật khẩu mới!" }]}
                    >
                        <Input.Password size="large" placeholder="Nhập mật khẩu mới" />
                    </Form.Item>

                    <Form.Item
                        label="Xác nhận mật khẩu"
                        name="confirmPassword"
                        dependencies={["password"]}
                        rules={[
                            { required: true, message: "Vui lòng xác nhận mật khẩu!" },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue("password") === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(
                                        new Error("Mật khẩu xác nhận không khớp!"),
                                    );
                                },
                            }),
                        ]}
                    >
                        <Input.Password size="large" placeholder="Nhập lại mật khẩu" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" size="large" block>
                            Xác Nhận Đổi
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}
