"use client";
import { useEffect, useState } from "react";
import { Spin } from "antd";
import { useRouter } from "next/navigation";
import LatestProducts from "@/components/LatestProducts";
import api from "@/utils/axios";

// Import các Component Modal đã chia nhỏ
import AuthModal from "@/components/AuthModal";
import WelcomeModal from "@/components/WelcomeModal";

export default function HomePage() {
    const router = useRouter();
    const [authState, setAuthState] = useState({
        isAuth: false,
        userName: "",
        loading: true,
    });

    const [activeNotifications, setActiveNotifications] = useState([]);

    // States cho Modal
    const [isWelcomeModalVisible, setIsWelcomeModalVisible] = useState(false);
    const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

    const [dontShowWelcomeAgain, setDontShowWelcomeAgain] = useState(false);
    const [dontShowAuthAgain, setDontShowAuthAgain] = useState(false);

    useEffect(() => {
        // Lấy danh sách thông báo động
        const fetchNotifications = async () => {
            try {
                const res = await api.get("/notifications/active");
                setActiveNotifications(res.data);
            } catch (error) {
                console.error("Lỗi lấy thông báo:", error);
            }
        };
        fetchNotifications();

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
                const hideWelcomeUntil = localStorage.getItem("hideWelcomeModalUntil");
                if (!hideWelcomeUntil || now > parseInt(hideWelcomeUntil, 10)) {
                    setIsWelcomeModalVisible(true);
                }
            } else {
                const hideAuthUntil = localStorage.getItem("hideAuthModalUntil");
                if (!hideAuthUntil || now > parseInt(hideAuthUntil, 10)) {
                    setIsAuthModalVisible(true);
                }
            }
        }, 0);

        return () => clearTimeout(checkAuthTimeout);
    }, []);

    const handleCloseWelcomeModal = () => {
        if (dontShowWelcomeAgain) {
            const expireTime = Date.now() + 6 * 60 * 60 * 1000;
            localStorage.setItem("hideWelcomeModalUntil", expireTime.toString());
        }
        setIsWelcomeModalVisible(false);
    };

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

            <AuthModal
                isOpen={isAuthModalVisible}
                onClose={handleCloseAuthModal}
                onLogin={() => router.push("/login")}
                onCheckboxChange={setDontShowAuthAgain}
            />

            <WelcomeModal
                isOpen={isWelcomeModalVisible}
                onClose={handleCloseWelcomeModal}
                userName={authState.userName}
                onCheckboxChange={setDontShowWelcomeAgain}
                notifications={activeNotifications}
            />
        </div>
    );
}
