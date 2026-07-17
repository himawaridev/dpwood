"use client";

import { useEffect, useState } from "react";

const overlayStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 10000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ffffff",
};

const contentStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 14,
    color: "#f09b90",
    fontFamily: "Arial, Helvetica, sans-serif",
};

export default function AppBootLoader() {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = window.setTimeout(() => setVisible(false), 500);
        return () => window.clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <div style={overlayStyle} role="status" aria-live="polite" aria-label="Đang tải DPWOOD">
            <div style={contentStyle}>
                <span className="dp-boot-loader-spinner" aria-hidden="true" />
                <strong>DPWOOD</strong>
            </div>
        </div>
    );
}
