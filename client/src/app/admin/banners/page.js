"use client";

import { useCallback, useEffect, useState } from "react";
import { App, Flex, Image, Popconfirm, Switch, Table, Tag, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import api from "@/utils/axios";
import AdminIconButton from "@/components/ui/AdminIconButton";
import BannerModal from "./components/BannerModal";

const { Title, Text } = Typography;

export default function AdminBannersPage() {
    const { message } = App.useApp();
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);

    const fetchBanners = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/banners", { authRequired: true });
            setBanners(response.data || []);
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể tải danh sách banner");
        } finally {
            setLoading(false);
        }
    }, [message]);

    useEffect(() => {
        fetchBanners();
    }, [fetchBanners]);

    const toggleBanner = async (banner) => {
        try {
            await api.put(`/banners/${banner.id}`, { isActive: !banner.isActive }, { authRequired: true });
            setBanners((current) => current.map((item) => (
                item.id === banner.id ? { ...item, isActive: !item.isActive } : item
            )));
            message.success("Đã cập nhật trạng thái banner");
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể cập nhật banner");
        }
    };

    const deleteBanner = async (id) => {
        try {
            await api.delete(`/banners/${id}`, { authRequired: true });
            setBanners((current) => current.filter((item) => item.id !== id));
            message.success("Đã xóa banner");
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể xóa banner");
        }
    };

    const columns = [
        {
            title: "Ảnh",
            dataIndex: "imageUrl",
            width: 180,
            render: (imageUrl, record) => (
                <Image
                    src={imageUrl}
                    alt={record.title}
                    width={150}
                    height={70}
                    fallback="/linkbanner.png"
                    style={{ objectFit: "cover" }}
                />
            ),
        },
        {
            title: "Nội dung",
            key: "content",
            render: (_, record) => (
                <Flex vertical gap={3} style={{ maxWidth: 460 }}>
                    <Text strong>{record.title}</Text>
                    <Text type="secondary" ellipsis>{record.description || "Chưa có mô tả"}</Text>
                    <Text className="dp-admin-banner-link">{record.buttonLink}</Text>
                </Flex>
            ),
        },
        { title: "Thứ tự", dataIndex: "sortOrder", width: 90, align: "center" },
        {
            title: "Trạng thái",
            dataIndex: "isActive",
            width: 130,
            render: (isActive, record) => (
                <Flex gap="small" align="center">
                    <Switch checked={isActive} onChange={() => toggleBanner(record)} />
                    <Tag color={isActive ? "success" : "default"}>{isActive ? "Đang bật" : "Đã tắt"}</Tag>
                </Flex>
            ),
        },
        {
            title: "Hành động",
            key: "actions",
            width: 120,
            render: (_, record) => (
                <Flex gap="small">
                    <AdminIconButton
                        label="Chỉnh sửa banner"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingBanner(record);
                            setModalOpen(true);
                        }}
                    />
                    <Popconfirm
                        title="Xóa banner này?"
                        description="Banner sẽ biến mất khỏi trang chủ."
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => deleteBanner(record.id)}
                    >
                        <AdminIconButton label="Xóa banner" icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Flex>
            ),
        },
    ];

    return (
        <>
            <Flex justify="space-between" align="center" gap="middle" wrap style={{ marginBottom: 20 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Quản lý banner trang chủ</Title>
                    <Text type="secondary">Tùy chỉnh ảnh và nội dung trình chiếu độc lập với sản phẩm.</Text>
                </div>
                <AdminIconButton
                    label="Thêm banner mới"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setEditingBanner(null);
                        setModalOpen(true);
                    }}
                />
            </Flex>

            <Table
                rowKey="id"
                dataSource={banners}
                columns={columns}
                loading={loading}
                pagination={false}
                scroll={{ x: 860 }}
                locale={{ emptyText: "Chưa có banner. Hãy thêm banner đầu tiên." }}
            />

            <BannerModal
                open={modalOpen}
                banner={editingBanner}
                onClose={() => setModalOpen(false)}
                onSaved={fetchBanners}
            />
        </>
    );
}
