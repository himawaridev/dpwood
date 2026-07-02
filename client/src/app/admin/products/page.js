"use client";

import { useCallback, useEffect, useState } from "react";
import { App, Button, Flex, Input, Modal, Typography } from "antd";
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
    const [aiOpen, setAiOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiLoading, setAiLoading] = useState(false);

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

    const handleAiDraft = async () => {
        const prompt = aiPrompt.trim();
        if (prompt.length < 8) {
            message.warning("Vui lòng nhập yêu cầu chi tiết hơn để AI tạo sản phẩm.");
            return;
        }

        try {
            setAiLoading(true);
            const res = await api.post("/ai/product-draft", { prompt });
            setEditingProduct(null);
            setDraftProduct(res.data?.draft || null);
            setAiOpen(false);
            setAiPrompt("");
            setIsModalVisible(true);
            message.success("AI đã tạo nháp sản phẩm. Bạn kiểm tra rồi bấm lưu.");
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể tạo nháp sản phẩm bằng AI");
        } finally {
            setAiLoading(false);
        }
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
                onAiDraft={() => setAiOpen(true)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRefresh={fetchProducts}
                aiLoading={aiLoading}
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

            <Modal
                title="AI tạo nháp sản phẩm"
                open={aiOpen}
                onCancel={() => setAiOpen(false)}
                footer={[
                    <Button key="cancel" onClick={() => setAiOpen(false)}>
                        Hủy
                    </Button>,
                    <Button key="generate" type="primary" loading={aiLoading} onClick={handleAiDraft}>
                        Tạo nháp
                    </Button>,
                ]}
            >
                <Flex vertical gap={12}>
                    <Typography.Text type="secondary">
                        Mô tả sản phẩm bạn muốn bán. AI sẽ điền form, bạn vẫn có thể sửa giá, tồn kho, ảnh và biến thể trước khi lưu.
                    </Typography.Text>
                    <Input.TextArea
                        rows={5}
                        value={aiPrompt}
                        onChange={(event) => setAiPrompt(event.target.value)}
                        placeholder="VD: Tạo sản phẩm bộ bát đĩa sứ trắng 12 món, có màu trắng/đen/hồng pastel, mỗi màu có bộ nhỏ, bộ 12 món và bộ lớn."
                    />
                </Flex>
            </Modal>
        </>
    );
}
