"use client";

import { useCallback, useEffect, useState } from "react";
import { App, Flex, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import AdminIconButton from "@/components/ui/AdminIconButton";
import api from "@/utils/axios";
import CategoryManagerPanel from "../components/CategoryManagerPanel";

const { Text, Title } = Typography;

export default function ProductCategoriesPage() {
    const { message } = App.useApp();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/products/categories");
            setCategories(response.data || []);
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể tải danh mục sản phẩm.");
        } finally {
            setLoading(false);
        }
    }, [message]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return (
        <>
            <Flex justify="space-between" align="center" gap="middle" wrap style={{ marginBottom: 20 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Danh mục sản phẩm</Title>
                    <Text type="secondary">Quản lý cách phân nhóm và hình ảnh danh mục trên cửa hàng.</Text>
                </div>
                <AdminIconButton
                    label="Làm mới danh mục"
                    icon={<ReloadOutlined />}
                    loading={loading}
                    onClick={fetchCategories}
                />
            </Flex>
            <CategoryManagerPanel categories={categories} loading={loading} onRefresh={fetchCategories} />
        </>
    );
}
