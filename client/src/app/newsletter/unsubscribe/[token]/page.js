"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, Result, Spin } from "antd";
import api from "@/utils/axios";

export default function UnsubscribeNewsletterPage() {
    const { token } = useParams();
    const requested = useRef(false);
    const [state, setState] = useState({ loading: true, success: false, message: "" });

    useEffect(() => {
        if (!token || requested.current) return;
        requested.current = true;
        api.post(`/newsletter/unsubscribe/${encodeURIComponent(token)}`)
            .then((response) =>
                setState({ loading: false, success: true, message: response.data?.message || "Đã hủy đăng ký" }),
            )
            .catch((error) =>
                setState({
                    loading: false,
                    success: false,
                    message: error.response?.data?.message || "Không thể hủy đăng ký",
                }),
            );
    }, [token]);

    if (state.loading) return <Spin fullscreen tip="Đang cập nhật đăng ký..." />;

    return (
        <Result
            status={state.success ? "success" : "error"}
            title={state.success ? "Đã hủy đăng ký" : "Không thể hủy đăng ký"}
            subTitle={state.message}
            extra={
                <Link href="/">
                    <Button type="primary">Về trang chủ</Button>
                </Link>
            }
        />
    );
}
