"use client";

import { ConfigProvider, App as AntApp } from "antd";
import viVN from "antd/locale/vi_VN";

const theme = {
    token: {
        colorPrimary: "#f09b90",
        colorInfo: "#f09b90",
        colorSuccess: "#16a34a",
        colorWarning: "#d97706",
        colorError: "#dc2626",
        colorText: "#222222",
        colorTextSecondary: "#777777",
        colorBgBase: "#ffffff",
        colorBgLayout: "#ffffff",
        colorBorder: "#ebebeb",
        borderRadius: 0,
        borderRadiusLG: 0,
        borderRadiusSM: 0,
        fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
        boxShadow: "0 10px 30px rgba(24, 39, 75, 0.08)",
    },
    components: {
        Button: {
            borderRadius: 8,
            controlHeight: 40,
            controlHeightLG: 48,
            fontWeight: 600,
            primaryShadow: "none",
        },
        Card: {
            borderRadiusLG: 8,
            paddingLG: 20,
        },
        Layout: {
            bodyBg: "#ffffff",
            headerBg: "#ffffff",
            siderBg: "#10231e",
            triggerBg: "#10231e",
        },
        Menu: {
            itemBorderRadius: 8,
            activeBarBorderWidth: 0,
        },
        Table: {
            headerBg: "#f3f6f1",
            headerColor: "#34423d",
            rowHoverBg: "#f7faf5",
        },
        Tabs: {
            itemSelectedColor: "#f09b90",
            inkBarColor: "#f09b90",
        },
        Tag: {
            borderRadiusSM: 999,
        },
    },
};

export default function Providers({ children }) {
    return (
        <ConfigProvider locale={viVN} theme={theme}>
            <AntApp>{children}</AntApp>
        </ConfigProvider>
    );
}
