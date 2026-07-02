"use client";

import React, { useEffect, useState } from "react";
import { Layout, FloatButton } from "antd";
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
            <AiSupportChat />
            <FloatButton.BackTop
                duration={400}
                visibilityHeight={160}
                style={{ right: 24, bottom: 32 }}
                tooltip="Lên đầu trang"
            />
        </Layout>
    );
}
