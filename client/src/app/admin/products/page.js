"use client";

import { useCallback, useEffect, useState } from "react";
import { App } from "antd";
import api from "@/utils/axios";
import ProductModal from "./components/ProductModal";
import ProductTable from "./components/ProductTable";

export default function AdminProductsPage() {
    const { message } = App.useApp();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [draftProduct, setDraftProduct] = useState(null);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/products");
            setProducts(res.data || []);
        } catch {
            message.error("Không thể lấy danh sách sản phẩm");
        } finally {
            setLoading(false);
        }
    }, [message]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleAdd = () => {
        setEditingProduct(null);
        setDraftProduct(null);
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingProduct(record);
        setDraftProduct(null);
        setIsModalVisible(true);
    };

    const handleSave = async (values) => {
        try {
            const validImages = (values.images || []).filter((image) => image && image.trim() !== "");
            const variants = (values.variants || [])
                .filter((variant) => variant?.color || variant?.size)
                .map((variant, index) => ({
                    variantId: variant.variantId || `${Date.now()}-${index}`,
                    color: variant.color || "",
                    size: variant.size || "",
                    price: Number(variant.price || values.price || 0),
                    stock: Number(variant.stock || 0),
                    imageUrl: variant.imageUrl || "",
                }));
            const payload = {
                ...values,
                images: validImages,
                imageUrl: validImages.length > 0 ? validImages[0] : null,
                variants,
                stock: variants.length
                    ? variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
                    : Number(values.stock || 0),
            };

            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, payload);
                message.success("Cập nhật sản phẩm thành công");
            } else {
                await api.post("/products", payload);
                message.success("Thêm sản phẩm thành công");
            }

            setIsModalVisible(false);
            setDraftProduct(null);
            fetchProducts();
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.response?.data?.message || "Lỗi không xác định";
            message.error(`Lỗi: ${errorMsg}`);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/products/${id}`);
            message.success("Đã xóa sản phẩm");
            fetchProducts();
        } catch {
            message.error("Không thể xóa sản phẩm");
        }
    };

    return (
        <>
            <ProductTable
                products={products}
                loading={loading}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRefresh={fetchProducts}
            />

            <ProductModal
                isVisible={isModalVisible}
                onClose={() => {
                    setIsModalVisible(false);
                    setDraftProduct(null);
                }}
                onSave={handleSave}
                editingProduct={editingProduct}
                draftProduct={draftProduct}
            />
        </>
    );
}
