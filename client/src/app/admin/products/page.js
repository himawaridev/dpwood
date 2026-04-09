"use client";
import { useEffect, useState } from "react";
import { message } from "antd";
import api from "@/utils/axios";

// 🔴 Import các Component đã chia nhỏ
import ProductTable from "./components/ProductTable";
import ProductModal from "./components/ProductModal";

export default function AdminProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await api.get("/products");
            setProducts(res.data);
        } catch (error) {
            message.error("Không thể lấy danh sách sản phẩm");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleAdd = () => {
        setEditingProduct(null);
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingProduct(record);
        setIsModalVisible(true);
    };

    const handleSave = async (values) => {
        try {
            const validImages = values.images.filter((img) => img && img.trim() !== "");

            const payload = {
                ...values,
                images: validImages,
                imageUrl: validImages.length > 0 ? validImages[0] : null,
            };

            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, payload);
                message.success("Cập nhật sản phẩm thành công");
            } else {
                await api.post("/products", payload);
                message.success("Thêm sản phẩm thành công");
            }
            setIsModalVisible(false);
            fetchProducts();
        } catch (error) {
            const errorMsg =
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Lỗi không xác định";
            message.error(`Lỗi: ${errorMsg}`);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/products/${id}`);
            message.success("Đã xóa sản phẩm");
            fetchProducts();
        } catch (error) {
            message.error("Không thể xóa sản phẩm");
        }
    };

    return (
        <>
            {/* Cột hiển thị bảng và thanh tìm kiếm */}
            <ProductTable
                products={products}
                loading={loading}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRefresh={fetchProducts}
            />

            {/* Modal chứa Form */}
            <ProductModal
                isVisible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSave={handleSave}
                editingProduct={editingProduct}
            />
        </>
    );
}
