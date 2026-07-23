"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, App, Input, Modal, Typography } from "antd";
import api from "@/utils/axios";
import ProductModal from "./components/ProductModal";
import ProductTable from "./components/ProductTable";

const { Text } = Typography;
const DELETE_ALL_CONFIRMATION = "XOA TAT CA";

export default function AdminProductsPage() {
    const { message } = App.useApp();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [draftProduct, setDraftProduct] = useState(null);
    const [deleteAllOpen, setDeleteAllOpen] = useState(false);
    const [deleteAllConfirmation, setDeleteAllConfirmation] = useState("");
    const [deletingAll, setDeletingAll] = useState(false);
    const [categories, setCategories] = useState([]);
    const [facets, setFacets] = useState({ materials: [], colors: [] });

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const [productResponse, categoryResponse] = await Promise.all([
                api.get("/products", { params: { withFacets: true } }),
                api.get("/products/categories"),
            ]);
            setProducts(productResponse.data?.products || []);
            setFacets(productResponse.data?.facets || { materials: [], colors: [] });
            setCategories(categoryResponse.data || []);
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

    const handleCreateCategory = async (label) => {
        const response = await api.post("/products/categories", { label });
        await fetchProducts();
        return response.data;
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
                const response = await api.put(`/products/${editingProduct.id}`, payload);
                const persistedStock = Number(response.data?.product?.stock);
                if (!Number.isFinite(persistedStock) || persistedStock !== payload.stock) {
                    throw new Error("Tồn kho trên máy chủ chưa được cập nhật đúng. Vui lòng thử lại.");
                }
                message.success("Cập nhật sản phẩm thành công");
            } else {
                await api.post("/products", payload);
                message.success("Thêm sản phẩm thành công");
            }

            setIsModalVisible(false);
            setDraftProduct(null);
            await fetchProducts();
        } catch (error) {
            const errorMsg =
                error.response?.data?.error ||
                error.response?.data?.message ||
                error.message ||
                "Lỗi không xác định";
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

    const closeDeleteAllModal = () => {
        if (deletingAll) return;
        setDeleteAllOpen(false);
        setDeleteAllConfirmation("");
    };

    const handleDeleteAll = async () => {
        if (deleteAllConfirmation !== DELETE_ALL_CONFIRMATION) return;

        try {
            setDeletingAll(true);
            const response = await api.delete("/products/all");
            message.success(response.data?.message || "Đã xóa toàn bộ sản phẩm khỏi cửa hàng.");
            setDeleteAllOpen(false);
            setDeleteAllConfirmation("");
            await fetchProducts();
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể xóa toàn bộ sản phẩm.");
        } finally {
            setDeletingAll(false);
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
                onDeleteAll={() => setDeleteAllOpen(true)}
                deletingAll={deletingAll}
            />

            <Modal
                title="Xóa toàn bộ sản phẩm"
                open={deleteAllOpen}
                onCancel={closeDeleteAllModal}
                onOk={handleDeleteAll}
                okText="Xóa toàn bộ"
                cancelText="Hủy"
                confirmLoading={deletingAll}
                maskClosable={false}
                keyboard={!deletingAll}
                okButtonProps={{
                    danger: true,
                    disabled: deleteAllConfirmation !== DELETE_ALL_CONFIRMATION,
                }}
            >
                <Alert
                    type="error"
                    showIcon
                    title={`Bạn sắp xóa ${products.length} sản phẩm khỏi cửa hàng`}
                    description="Sản phẩm sẽ biến mất khỏi trang bán hàng, tìm kiếm, wishlist và AI tư vấn. Lịch sử đơn hàng cũ vẫn được giữ lại."
                    style={{ marginBottom: 18 }}
                />
                <Text>
                    Nhập chính xác <Text code>{DELETE_ALL_CONFIRMATION}</Text> để xác nhận:
                </Text>
                <Input
                    value={deleteAllConfirmation}
                    onChange={(event) => setDeleteAllConfirmation(event.target.value)}
                    placeholder={DELETE_ALL_CONFIRMATION}
                    disabled={deletingAll}
                    autoComplete="off"
                    style={{ marginTop: 10 }}
                />
            </Modal>

            <ProductModal
                isVisible={isModalVisible}
                onClose={() => {
                    setIsModalVisible(false);
                    setDraftProduct(null);
                }}
                onSave={handleSave}
                editingProduct={editingProduct}
                draftProduct={draftProduct}
                categories={categories}
                materialOptions={facets.materials || []}
                colorOptions={facets.colors || []}
                onCreateCategory={handleCreateCategory}
            />
        </>
    );
}
