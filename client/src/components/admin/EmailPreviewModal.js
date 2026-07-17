"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Modal, Skeleton } from "antd";
import api from "@/utils/axios";

export default function EmailPreviewModal({
    open,
    onClose,
    subject,
    preview,
    contentHtml,
    audience = "verified_users",
    recipientName,
}) {
    const [html, setHtml] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const iframeRef = useRef(null);
    const [frame, setFrame] = useState({ width: 680, height: 560, scale: 0.82 });

    const fitPreview = useCallback(() => {
        const iframe = iframeRef.current;
        const documentElement = iframe?.contentDocument?.documentElement;
        const body = iframe?.contentDocument?.body;
        if (!iframe || !documentElement || !body) return;

        documentElement.style.overflow = "hidden";
        body.style.overflow = "hidden";
        const width = Math.max(documentElement.scrollWidth, body.scrollWidth, 680);
        const height = Math.max(documentElement.scrollHeight, body.scrollHeight, 560);
        const availableWidth = Math.max(Math.min(window.innerWidth - 96, 600), 280);
        const availableHeight = Math.max(Math.min(window.innerHeight * 0.68, 620), 360);
        const scale = Math.max(Math.min(0.84, availableWidth / width, availableHeight / height), 0.55);

        setFrame({ width, height, scale });
    }, []);

    useEffect(() => {
        if (!open) return undefined;

        let active = true;
        const loadPreview = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await api.post(
                    "/newsletter/admin/preview",
                    { audience, subject, preview, contentHtml, recipientName },
                    { authRequired: true },
                );
                if (active) setHtml(response.data?.html || "");
            } catch (requestError) {
                if (active) {
                    setHtml("");
                    setError(requestError.response?.data?.message || "Không thể tạo bản xem trước email");
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        void loadPreview();
        return () => { active = false; };
    }, [audience, contentHtml, open, preview, recipientName, subject]);

    useEffect(() => {
        if (!open) return undefined;
        window.addEventListener("resize", fitPreview);
        return () => window.removeEventListener("resize", fitPreview);
    }, [fitPreview, open]);

    return (
        <Modal
            open={open}
            title="Bản xem trước email người nhận"
            onCancel={onClose}
            footer={null}
            width={660}
            destroyOnHidden
            styles={{ body: { padding: 14, background: "#f8f8f8", overflow: "hidden" } }}
        >
            {loading ? (
                <div style={{ padding: 28 }}><Skeleton active paragraph={{ rows: 12 }} /></div>
            ) : error ? (
                <div style={{ padding: 24 }}><Alert type="error" showIcon title={error} /></div>
            ) : (
                <div style={{ display: "flex", justifyContent: "center", width: "100%", overflow: "hidden" }}>
                    <div
                        style={{
                            width: frame.width * frame.scale,
                            height: frame.height * frame.scale,
                            maxWidth: "100%",
                            overflow: "hidden",
                            background: "#f8f8f8",
                        }}
                    >
                        <iframe
                            ref={iframeRef}
                            title="Bản xem trước email DPWOOD"
                            srcDoc={html}
                            sandbox="allow-same-origin"
                            scrolling="no"
                            onLoad={fitPreview}
                            style={{
                                display: "block",
                                width: frame.width,
                                height: frame.height,
                                border: 0,
                                overflow: "hidden",
                                transform: `scale(${frame.scale})`,
                                transformOrigin: "top left",
                            }}
                        />
                    </div>
                </div>
            )}
        </Modal>
    );
}
