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
    const [jsonLoading, setJsonLoading] = useState(false);

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

    const handleExportJson = () => {
        if (!products.length) {
            message.warning("Chưa có sản phẩm để xuất file JSON.");
            return;
        }

        const exportProducts = products.map((product) => {
            const images = [...new Set([product.imageUrl, ...(Array.isArray(product.images) ? product.images : [])])]
                .filter(Boolean);

            return {
                name: product.name || "",
                description: product.description || "",
                price: Number(product.price || 0),
                stock: Number(product.stock || 0),
                imageUrl: images[0] || "",
                images,
                variants: (Array.isArray(product.variants) ? product.variants : []).map((variant) => ({
                    variantId: variant.variantId || "",
                    color: variant.color || "",
                    size: variant.size || variant.capacity || "",
                    price: Number(variant.price || product.price || 0),
                    stock: Number(variant.stock || 0),
                    imageUrl: variant.imageUrl || "",
                })),
                category: product.category || "cookware",
                material: product.material || "",
                color: product.color || "",
                brand: product.brand || "DPWOOD Kitchen",
                capacity: product.capacity || "",
                warranty: product.warranty || "",
                origin: product.origin || "",
                dishwasherSafe: Boolean(product.dishwasherSafe),
                microwaveSafe: Boolean(product.microwaveSafe),
            };
        });
        const payload = {
            version: 1,
            source: "DPWOOD Admin Products",
            exportedAt: new Date().toISOString(),
            total: exportProducts.length,
            products: exportProducts,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: "application/json;charset=utf-8",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `dpwood-products-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        message.success(`Đã xuất ${exportProducts.length} sản phẩm sang JSON.`);
    };

    const handleImportJson = async (file) => {
        if (jsonLoading) return false;

        try {
            setJsonLoading(true);
            const text = await file.text();
            const parsed = JSON.parse(text);
            const importProducts = Array.isArray(parsed) ? parsed : parsed?.products;

            if (!Array.isArray(importProducts) || !importProducts.length) {
                throw new Error("File JSON cần là mảng sản phẩm hoặc object có trường products.");
            }

            const normalizedResponse = await api.post("/ai/product-json-import", {
                products: importProducts,
                useFreeResources: true,
            });
            const normalizedProducts = normalizedResponse.data?.products || [];
            if (!normalizedProducts.length) {
                throw new Error("Không tìm thấy sản phẩm hợp lệ trong file JSON.");
            }

            const savedResponse = await api.post("/ai/product-batch-save", {
                products: normalizedProducts,
            });
            const savedProducts = savedResponse.data?.products || [];
            message.success(`Đã import ${savedProducts.length} sản phẩm vào kho.`);
            await fetchProducts();
        } catch (error) {
            message.error(error.response?.data?.message || error.message || "Không thể import file JSON sản phẩm.");
        } finally {
            setJsonLoading(false);
        }

        return false;
    };

    const handleDownloadSample = async () => {
        try {
            setJsonLoading(true);
            const response = await api.get("/ai/product-json-sample", { responseType: "blob" });
            const url = window.URL.createObjectURL(
                new Blob([response.data], { type: "application/json;charset=utf-8" }),
            );
            const link = document.createElement("a");
            link.href = url;
            link.download = "sample-kitchen-products.json";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể tải file JSON mẫu.");
        } finally {
            setJsonLoading(false);
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
                onExportJson={handleExportJson}
                onDeleteAll={() => setDeleteAllOpen(true)}
                deletingAll={deletingAll}
                onImportJson={handleImportJson}
                onDownloadSample={handleDownloadSample}
                jsonLoading={jsonLoading}
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
            />
        </>
    );
}
