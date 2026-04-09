"use client";
import { useEffect, useState } from "react";
import { Spin } from "antd";
import { useRouter } from "next/navigation";
import LatestProducts from "@/components/LatestProducts";

// 🔴 Import các Component Modal đã chia nhỏ
import AuthModal from "@/components/AuthModal";
import WelcomeModal from "@/components/WelcomeModal";

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
    const [dontShowAuthAgain, setDontShowAuthAgain] = useState(false);

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
                // LOGIC MODAL YÊU CẦU ĐĂNG NHẬP
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

    // Xử lý đóng Modal Yêu cầu đăng nhập
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

            {/* 🔴 Nhúng Component AuthModal */}
            <AuthModal
                isOpen={isAuthModalVisible}
                onClose={handleCloseAuthModal}
                onLogin={() => router.push("/login")}
                onCheckboxChange={setDontShowAuthAgain}
            />

            {/* 🔴 Nhúng Component WelcomeModal */}
            <WelcomeModal
                isOpen={isWelcomeModalVisible}
                onClose={handleCloseWelcomeModal}
                userName={authState.userName}
                onCheckboxChange={setDontShowWelcomeAgain}
            />
        </div>
    );
}
