"use client";
import { useEffect, useState } from "react";
import { Button, Typography, Modal, Checkbox, Spin, Space, Divider } from "antd";
import { useRouter } from "next/navigation";
import { LoginOutlined, InfoCircleOutlined } from "@ant-design/icons";
import LatestProducts from "@/components/LatestProducts";

const { Text } = Typography;

export default function HomePage() {
    const router = useRouter();
    const [authState, setAuthState] = useState({
        isAuth: false,
        userName: "",
        loading: true,
    });

    // States cho Modal
    const [isWelcomeModalVisible, setIsWelcomeModalVisible] = useState(false);
    const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

    // States cho việc ẩn thông báo
    const [dontShowWelcomeAgain, setDontShowWelcomeAgain] = useState(false);
    const [dontShowAuthAgain, setDontShowAuthAgain] = useState(false); // 🔴 State cho modal Đăng nhập

    useEffect(() => {
        const checkAuthTimeout = setTimeout(() => {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const name = typeof window !== "undefined" ? localStorage.getItem("userName") : "";
            const now = Date.now();

            setAuthState({
                isAuth: !!token,
                userName: name || "Người dùng",
                loading: false,
            });

            if (token) {
                // LOGIC MODAL CHÀO MỪNG
                const hideWelcomeUntil = localStorage.getItem("hideWelcomeModalUntil");
                if (!hideWelcomeUntil || now > parseInt(hideWelcomeUntil, 10)) {
                    setIsWelcomeModalVisible(true);
                }
            } else {
                // 🔴 LOGIC MODAL YÊU CẦU ĐĂNG NHẬP (Thêm kiểm tra thời gian ẩn)
                const hideAuthUntil = localStorage.getItem("hideAuthModalUntil");
                if (!hideAuthUntil || now > parseInt(hideAuthUntil, 10)) {
                    setIsAuthModalVisible(true);
                }
            }
        }, 0);

        return () => clearTimeout(checkAuthTimeout);
    }, []);

    // Xử lý đóng Modal Chào mừng
    const handleCloseWelcomeModal = () => {
        if (dontShowWelcomeAgain) {
            const expireTime = Date.now() + 6 * 60 * 60 * 1000;
            localStorage.setItem("hideWelcomeModalUntil", expireTime.toString());
        }
        setIsWelcomeModalVisible(false);
    };

    // 🔴 Xử lý đóng Modal Yêu cầu đăng nhập
    const handleCloseAuthModal = () => {
        if (dontShowAuthAgain) {
            const expireTime = Date.now() + 6 * 60 * 60 * 1000;
            localStorage.setItem("hideAuthModalUntil", expireTime.toString());
        }
        setIsAuthModalVisible(false);
    };

    if (authState.loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: "50px 0" }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: "100%", maxWidth: 1200 }}>
                <LatestProducts />
            </div>

            {/* MODAL THÔNG BÁO CHƯA ĐĂNG NHẬP (Đã thêm tính năng ẩn 6h) */}
            <Modal
                title={
                    <Space>
                        <InfoCircleOutlined style={{ color: "#faad14" }} />
                        <span style={{ fontSize: "18px" }}>Yêu cầu đăng nhập</span>
                    </Space>
                }
                open={isAuthModalVisible}
                onCancel={handleCloseAuthModal}
                centered
                footer={[
                    <Button key="later" onClick={handleCloseAuthModal}>
                        Để sau
                    </Button>,
                    <Button
                        key="login"
                        type="primary"
                        icon={<LoginOutlined />}
                        onClick={() => router.push("/login")}
                    >
                        Đăng nhập ngay
                    </Button>,
                ]}
            >
                <div style={{ padding: "10px 0" }}>
                    <Text style={{ fontSize: "16px" }}>
                        Bạn hiện đang truy cập với tư cách <b>Khách</b>.
                    </Text>
                    <br />
                    <Text type="secondary">
                        Vui lòng đăng nhập để đặt hàng và xem lịch sử giao dịch.
                    </Text>

                    <Divider style={{ margin: "20px 0 10px 0" }} />

                    {/* 🔴 Checkbox ẩn 6h cho Modal Đăng nhập */}
                    <Checkbox onChange={(e) => setDontShowAuthAgain(e.target.checked)}>
                        Không hiển thị lại yêu cầu này trong 6 giờ
                    </Checkbox>
                </div>
            </Modal>

            {/* MODAL THÔNG BÁO CHÀO MỪNG */}
            <Modal
                title={
                    <span style={{ fontSize: "20px", color: "#001529" }}>Thông báo hệ thống</span>
                }
                open={isWelcomeModalVisible}
                onCancel={handleCloseWelcomeModal}
                centered
                footer={[
                    <Button key="close" type="primary" onClick={handleCloseWelcomeModal}>
                        Xác nhận
                    </Button>,
                ]}
            >
                <div style={{ padding: "16px 0" }}>
                    <Text style={{ fontSize: 16 }}>
                        Xin chào, <strong style={{ color: "#1890ff" }}>{authState.userName}</strong>
                        !
                    </Text>
                    <div
                        style={{
                            marginTop: 24,
                            padding: "12px",
                            background: "#f6ffed",
                            border: "1px solid #b7eb8f",
                            borderRadius: "8px",
                        }}
                    >
                        <Text strong style={{ color: "#52c41a" }}>
                            Khuyến mãi:
                        </Text>{" "}
                        Giảm ngay 10% cho đơn hàng đầu tiên!
                    </div>

                    <Divider style={{ margin: "20px 0 10px 0" }} />

                    <Checkbox onChange={(e) => setDontShowWelcomeAgain(e.target.checked)}>
                        Không hiển thị lại thông báo này trong 6 giờ
                    </Checkbox>
                </div>
            </Modal>
        </div>
    );
}
