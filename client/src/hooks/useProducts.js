import { useState, useEffect } from "react";
import { message } from "antd";
import api from "@/utils/axios";

export const useProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLatestProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get("/products");
            const sortedProducts = res.data.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
            );
            setProducts(sortedProducts.slice(0, 5));
            setError(null);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Lỗi tải sản phẩm mới";
            setError(msg);
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLatestProducts();
    }, []);

    return { products, loading, error, refetch: fetchLatestProducts };
};
