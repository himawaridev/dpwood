"use client";

import { useEffect, useState } from "react";
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

    return (
        <Modal
            open={open}
            title="Bản xem trước email người nhận"
            onCancel={onClose}
            footer={null}
            width={760}
            destroyOnHidden
            styles={{ body: { padding: 0, background: "#f8f8f8" } }}
        >
            {loading ? (
                <div style={{ padding: 28 }}><Skeleton active paragraph={{ rows: 12 }} /></div>
            ) : error ? (
                <div style={{ padding: 24 }}><Alert type="error" showIcon title={error} /></div>
            ) : (
                <iframe
                    title="Bản xem trước email DPWOOD"
                    srcDoc={html}
                    sandbox=""
                    style={{ display: "block", width: "100%", height: "72vh", minHeight: 560, border: 0 }}
                />
            )}
        </Modal>
    );
}
