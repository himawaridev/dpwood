"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, Result, Spin } from "antd";
import api from "@/utils/axios";

export default function ConfirmNewsletterPage() {
    const { token } = useParams();
    const requested = useRef(false);
    const [state, setState] = useState({ loading: true, success: false, message: "" });

    useEffect(() => {
        if (!token || requested.current) return;
        requested.current = true;
        api.post(`/newsletter/confirm/${encodeURIComponent(token)}`)
            .then((response) =>
                setState({ loading: false, success: true, message: response.data?.message || "Đăng ký thành công" }),
            )
            .catch((error) =>
                setState({
                    loading: false,
                    success: false,
                    message: error.response?.data?.message || "Không thể xác nhận đăng ký",
                }),
            );
    }, [token]);

    if (state.loading) {
        return <Spin fullscreen tip="Đang xác nhận đăng ký..." />;
    }

    return (
        <Result
            status={state.success ? "success" : "error"}
            title={state.success ? "Đã xác nhận bản tin" : "Xác nhận không thành công"}
            subTitle={state.message}
            extra={
                <Link href={state.success ? "/gift-codes" : "/"}>
                    <Button type="primary">{state.success ? "Mở kho mã ưu đãi" : "Về trang chủ"}</Button>
                </Link>
            }
        />
    );
}
