"use client";

import React, { useEffect, useState } from "react";
import { Layout } from "antd";
import { UpOutlined } from "@ant-design/icons";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import AppFooter from "./components/AppFooter";
import WelcomeModal from "@/components/WelcomeModal";
import AiSupportChat from "@/components/AiSupportChat";
import api from "@/utils/axios";

const { Content } = Layout;

export default function MainLayout({ children }) {
    const pathname = usePathname();
    const [notifications, setNotifications] = useState([]);
    const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
    const [snoozeWelcome, setSnoozeWelcome] = useState(false);
    const [userName, setUserName] = useState("khách hàng");
    const [showBackTop, setShowBackTop] = useState(false);
    const [isAiChatOpen, setIsAiChatOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const fetchActiveNotifications = async () => {
            if (pathname !== "/") {
                setIsWelcomeOpen(false);
                return;
            }

            setUserName(localStorage.getItem("userName") || "khách hàng");

            const hiddenUntil = Number(localStorage.getItem("dpwoodNotificationsHiddenUntil") || 0);
            if (hiddenUntil > Date.now()) return;

            try {
                const response = await api.get("/notifications/active");
                const activeNotifications = response.data || [];
                if (!cancelled) {
                    setNotifications(activeNotifications);
                    setIsWelcomeOpen(activeNotifications.length > 0);
                }
            } catch {
                if (!cancelled) {
                    setNotifications([]);
                    setIsWelcomeOpen(false);
                }
            }
        };

        fetchActiveNotifications();

        return () => {
            cancelled = true;
        };
    }, [pathname]);

    useEffect(() => {
        const handleScroll = () => {
            setShowBackTop(window.scrollY > 160);
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const handleCloseWelcome = () => {
        if (snoozeWelcome) {
            localStorage.setItem("dpwoodNotificationsHiddenUntil", String(Date.now() + 6 * 60 * 60 * 1000));
        }
        setIsWelcomeOpen(false);
        setSnoozeWelcome(false);
    };

    return (
        <Layout className="dp-shell">
            <Navbar />
            <Content style={{ background: "var(--dp-bg)" }}>{children}</Content>
            <WelcomeModal
                isOpen={isWelcomeOpen}
                onClose={handleCloseWelcome}
                userName={userName}
                onCheckboxChange={setSnoozeWelcome}
                notifications={notifications}
            />
            <AppFooter />
            <AiSupportChat onOpenChange={setIsAiChatOpen} />
            <button
                type="button"
                className={`dp-floating-action dp-backtop-action ${showBackTop && !isAiChatOpen ? "is-visible" : ""}`}
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                aria-label="Lên đầu trang"
                title="Lên đầu trang"
            >
                <UpOutlined className="dp-floating-action-icon" />
            </button>
        </Layout>
    );
}
