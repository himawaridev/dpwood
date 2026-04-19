"use client";
import React from "react";
import Navbar from "@/components/Navbar";
import { Layout, FloatButton } from "antd";

// 🔴 Import Footer đã được bóc tách
import AppFooter from "./components/AppFooter";

const { Content } = Layout;

export default function MainLayout({ children }) {
    return (
        <Layout style={{ minHeight: "100vh" }}>
            {/* Thanh điều hướng */}
            <Navbar />

            {/* Nội dung chính của trang web */}
            <Content className="main-content" style={{ background: "#f0f2f5" }}>{children}</Content>

            {/* Footer */}
            <AppFooter />

            {/* Nút Back To Top */}
            <FloatButton.BackTop
                duration={400}
                visibilityHeight={100}
                style={{ right: 30, bottom: 40 }}
                tooltip="Lên đầu trang"
            />
        </Layout>
    );
}
