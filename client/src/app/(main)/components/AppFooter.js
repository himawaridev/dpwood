import React from "react";
import { Layout, Row, Divider } from "antd";
import FooterAbout from "./FooterAbout";
import FooterPolicies from "./FooterPolicies";
import FooterContact from "./FooterContact";

const { Footer } = Layout;

export default function AppFooter() {
    return (
        <Footer
            style={{
                background: "#001529",
                color: "rgba(255, 255, 255, 0.65)",
                padding: "60px 50px 24px",
            }}
        >
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                <Row gutter={[48, 32]}>
                    <FooterAbout />
                    <FooterPolicies />
                    <FooterContact />
                </Row>
            </div>

            <Divider style={{ borderColor: "rgba(255,255,255,0.1)", margin: "32px 0 24px" }} />

            <div style={{ textAlign: "center", color: "rgba(255, 255, 255, 0.45)" }}>
                DPWOOD ©{new Date().getFullYear()} - Hệ thống bán gỗ nhập khẩu
            </div>
        </Footer>
    );
}
