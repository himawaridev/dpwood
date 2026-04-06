// src/app/verify/[token]/page.js
"use client";
import { useEffect, useState, useRef } from "react";
import { Card, Result, Button, Spin } from "antd";
import { useParams, useRouter } from "next/navigation";
import api from "@/utils/axios";

export default function VerifyEmailPage() {
    const [status, setStatus] = useState("loading");
    const [errorMessage, setErrorMessage] = useState("");
    const params = useParams();
    const router = useRouter();

    // Dùng useRef để đánh dấu xem API đã được gọi chưa
    const hasCalledAPI = useRef(false);

    useEffect(() => {
        const verifyAccount = async () => {
            // Nếu đã gọi rồi thì thoát luôn, không gọi lại nữa
            if (hasCalledAPI.current) return;
            hasCalledAPI.current = true;

            try {
                await api.get(`/auth/verify/${params.token}`);
                setStatus("success");
            } catch (error) {
                setStatus("error");
                setErrorMessage(
                    error.response?.data?.message ||
                        "Liên kết xác minh không hợp lệ hoặc đã hết hạn.",
                );
            }
        };

        if (params.token) {
            verifyAccount();
        }
    }, [params.token]);

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
            <Card
                style={{ width: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", textAlign: "center" }}
            >
                {status === "loading" && (
                    <div style={{ padding: "40px 0" }}>
                        <Spin size="large" />
                        <div style={{ marginTop: 20 }}>
                            Đang xác minh tài khoản của bạn, vui lòng đợi...
                        </div>
                    </div>
                )}

                {status === "success" && (
                    <Result
                        status="success"
                        title="Xác minh thành công!"
                        subTitle="Tài khoản email của bạn đã được kích hoạt. Bây giờ bạn có thể đăng nhập để sử dụng dịch vụ."
                        extra={[
                            <Button
                                type="primary"
                                key="login"
                                onClick={() => router.push("/login")}
                            >
                                Đăng Nhập Ngay
                            </Button>,
                        ]}
                    />
                )}

                {status === "error" && (
                    <Result
                        status="error"
                        title="Xác minh thất bại"
                        subTitle={errorMessage}
                        extra={[
                            <Button type="primary" key="home" onClick={() => router.push("/")}>
                                Về Trang Chủ
                            </Button>,
                        ]}
                    />
                )}
            </Card>
        </div>
    );
}
