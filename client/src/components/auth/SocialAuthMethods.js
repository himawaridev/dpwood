"use client";

import { useEffect, useRef } from "react";
import { Typography } from "antd";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";

const { Text } = Typography;
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const telegramBotUsername = String(
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "",
).replace(/^@/, "");

function TelegramLoginWidget({
    mode,
    loading,
    onAuth,
    onError,
}) {
    const containerRef = useRef(null);
    const onAuthRef = useRef(onAuth);
    const onErrorRef = useRef(onError);

    useEffect(() => {
        onAuthRef.current = onAuth;
        onErrorRef.current = onError;
    }, [onAuth, onError]);

    useEffect(() => {
        if (!telegramBotUsername || !containerRef.current) return undefined;

        const container = containerRef.current;
        const callbackName = `__dpwoodTelegramAuth_${mode}`;
        window[callbackName] = (telegramUser) => {
            onAuthRef.current?.(telegramUser);
        };

        const script = document.createElement("script");
        script.src = "https://telegram.org/js/telegram-widget.js?22";
        script.async = true;
        script.setAttribute("data-telegram-login", telegramBotUsername);
        script.setAttribute("data-size", "large");
        script.setAttribute("data-userpic", "false");
        script.setAttribute("data-radius", "0");
        script.setAttribute("data-lang", "vi");
        script.setAttribute("data-onauth", `${callbackName}(user)`);
        script.onerror = () => {
            onErrorRef.current?.();
        };

        container.replaceChildren(script);

        return () => {
            delete window[callbackName];
            container.replaceChildren();
        };
    }, [mode]);

    return (
        <div
            ref={containerRef}
            className={`dp-auth-telegram-widget ${loading ? "is-loading" : ""}`}
            aria-label={mode === "register" ? "Đăng ký với Telegram" : "Đăng nhập với Telegram"}
            aria-busy={loading}
        />
    );
}

export default function SocialAuthMethods({
    mode = "login",
    googleSubmitting,
    telegramSubmitting,
    onGoogleStart,
    onGoogleSuccess,
    onGoogleError,
    onTelegramAuth,
    onTelegramError,
}) {
    return (
        <div className="dp-auth-provider-list">
            {googleClientId ? (
                <GoogleOAuthProvider clientId={googleClientId}>
                    <div
                        className={`dp-auth-google-button ${googleSubmitting ? "is-loading" : ""}`}
                        aria-busy={googleSubmitting}
                    >
                        <GoogleLogin
                            onSuccess={onGoogleSuccess}
                            onError={onGoogleError}
                            click_listener={onGoogleStart}
                            ux_mode="popup"
                            use_fedcm_for_button={false}
                            text={mode === "register" ? "signup_with" : "signin_with"}
                            theme="outline"
                            size="large"
                            shape="rectangular"
                            logo_alignment="left"
                            width="280"
                            locale="vi"
                        />
                    </div>
                </GoogleOAuthProvider>
            ) : (
                <Text type="secondary" className="dp-auth-provider-config-note">
                    Chưa cấu hình mã ứng dụng Google.
                </Text>
            )}

            {telegramBotUsername && !googleSubmitting ? (
                <TelegramLoginWidget
                    mode={mode}
                    loading={telegramSubmitting}
                    onAuth={onTelegramAuth}
                    onError={onTelegramError}
                />
            ) : null}
            {!telegramBotUsername && (
                <Text type="secondary" className="dp-auth-provider-config-note">
                    Chưa cấu hình Telegram Bot Username.
                </Text>
            )}
        </div>
    );
}
