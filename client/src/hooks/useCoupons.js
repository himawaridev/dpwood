import { useState, useEffect } from "react";
import { message } from "antd";
import api from "@/utils/axios";

export const useCoupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [claimedIds, setClaimedIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [claimingId, setClaimingId] = useState(null);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const couponRes = await api.get("/coupons/active");
            setCoupons(couponRes.data);

            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            if (token) {
                const myRes = await api.get("/coupons/my", { authRequired: true });
                const ids = new Set(myRes.data.map((uc) => uc.couponId));
                setClaimedIds(ids);
            }
            setError(null);
        } catch (err) {
            setError(err.message || "Lỗi tải mã giảm giá");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const claimCoupon = async (couponId) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
            message.warning("Vui lòng đăng nhập để nhận mã giảm giá!");
            return false;
        }
        try {
            setClaimingId(couponId);
            await api.post("/coupons/claim", { couponId });
            message.success("Nhận mã giảm giá thành công! 🎉");
            setClaimedIds((prev) => new Set([...prev, couponId]));
            return true;
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể nhận mã giảm giá");
            return false;
        } finally {
            setClaimingId(null);
        }
    };

    return { 
        coupons, 
        claimedIds, 
        loading, 
        error, 
        claimingId, 
        claimCoupon, 
        refetch: fetchCoupons 
    };
};
