"use client";
import { useEffect, useState } from "react";
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    InputNumber,
    message,
    Popconfirm,
    Typography,
    Image,
    Flex,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import api from "@/utils/axios";

const { Title } = Typography;

export default function AdminProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [form] = Form.useForm();

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

    useEffect(() => {
        if (isModalVisible) {
            if (editingProduct) {
                const currentImages =
                    editingProduct.images?.length > 0
                        ? editingProduct.images
                        : [editingProduct.imageUrl].filter(Boolean);

                form.setFieldsValue({
                    ...editingProduct,
                    images: currentImages.length > 0 ? currentImages : [""],
                });
            } else {
                form.resetFields();
                form.setFieldsValue({ images: [""] });
            }
        }
    }, [isModalVisible, editingProduct, form]);

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

    const columns = [
        {
            title: "Hình ảnh",
            key: "image",
            render: (_, record) => {
                const displayUrl =
                    record.images && record.images.length > 0 ? record.images[0] : record.imageUrl;
                return displayUrl ? (
                    <Image
                        src={displayUrl}
                        alt={record.name}
                        width={50}
                        height={50}
                        style={{ objectFit: "cover", borderRadius: 4 }}
                    />
                ) : (
                    "Chưa có ảnh"
                );
            },
        },
        { title: "Tên sản phẩm", dataIndex: "name", key: "name", width: "25%" },
        {
            title: "Giá tiền (VNĐ)",
            dataIndex: "price",
            key: "price",
            render: (price) =>
                new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                    price,
                ),
        },
        { title: "Tồn kho", dataIndex: "stock", key: "stock" },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date) => new Date(date).toLocaleDateString("vi-VN"),
        },
        {
            title: "Hành động",
            key: "actions",
            render: (_, record) => (
                <Flex gap="small">
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="Xóa sản phẩm này?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Flex>
            ),
        },
    ];

    return (
        <>
            <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
                <Title level={3} style={{ margin: 0 }}>
                    Danh Sách Sản Phẩm
                </Title>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAdd}>
                    Thêm Sản Phẩm Mới
                </Button>
            </Flex>

            <Table
                dataSource={products}
                columns={columns}
                rowKey="id"
                loading={loading}
                scroll={{ x: 800 }}
            />

            <Modal
                title={editingProduct ? "Cập Nhật Sản Phẩm" : "Thêm Sản Phẩm Mới"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                destroyOnHidden
                width={700}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item
                        name="name"
                        label="Tên sản phẩm"
                        rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm" }]}
                    >
                        <Input size="large" placeholder="VD: Bàn gỗ Sồi cao cấp" />
                    </Form.Item>

                    <Form.Item name="description" label="Mô tả sản phẩm">
                        <Input.TextArea
                            rows={4}
                            placeholder="Nhập thông tin chi tiết về sản phẩm..."
                        />
                    </Form.Item>

                    <Flex gap="large" style={{ marginBottom: 16 }}>
                        <Form.Item
                            name="price"
                            label="Giá bán (VNĐ)"
                            rules={[{ required: true, message: "Vui lòng nhập giá" }]}
                            style={{ flex: 1, margin: 0 }}
                        >
                            <InputNumber
                                size="large"
                                style={{ width: "100%" }}
                                min={0}
                                step={1000}
                                formatter={(value) =>
                                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                }
                                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                            />
                        </Form.Item>
                        <Form.Item
                            name="stock"
                            label="Số lượng tồn kho"
                            rules={[{ required: true, message: "Nhập số lượng" }]}
                            style={{ flex: 1, margin: 0 }}
                        >
                            <InputNumber size="large" style={{ width: "100%" }} min={0} />
                        </Form.Item>
                    </Flex>

                    <div
                        style={{
                            background: "#fafafa",
                            padding: 16,
                            borderRadius: 8,
                            border: "1px solid #f0f0f0",
                            marginBottom: 24,
                        }}
                    >
                        <Typography.Text strong style={{ display: "block", marginBottom: 12 }}>
                            Danh sách Hình ảnh (URLs)
                        </Typography.Text>
                        <Form.List name="images">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map((field, index) => (
                                        // 🔴 KHẮC PHỤC TRIỆT ĐỂ: Dùng <div> làm wrapper chứa key, bỏ hoàn toàn cú pháp spread {...field}
                                        <div key={field.key} style={{ marginBottom: 12 }}>
                                            <Flex gap="small" align="center">
                                                <Form.Item
                                                    // Truyền trực tiếp các thuộc tính bắt buộc của Antd Form.List
                                                    name={field.name}
                                                    isListField={field.isListField}
                                                    fieldKey={field.fieldKey}
                                                    validateTrigger={["onChange", "onBlur"]}
                                                    rules={[
                                                        {
                                                            required: true,
                                                            whitespace: true,
                                                            message:
                                                                "Vui lòng nhập link ảnh hoặc xóa ô này",
                                                        },
                                                    ]}
                                                    noStyle
                                                >
                                                    <Input
                                                        placeholder={`Nhập đường dẫn ảnh ${index + 1} (https://...)`}
                                                    />
                                                </Form.Item>
                                                {fields.length > 1 ? (
                                                    <MinusCircleOutlined
                                                        style={{
                                                            color: "#ff4d4f",
                                                            fontSize: "20px",
                                                            cursor: "pointer",
                                                        }}
                                                        onClick={() => remove(field.name)}
                                                    />
                                                ) : null}
                                            </Flex>
                                        </div>
                                    ))}
                                    <Form.Item style={{ margin: 0 }}>
                                        <Button
                                            type="dashed"
                                            onClick={() => add()}
                                            block
                                            icon={<PlusOutlined />}
                                        >
                                            Thêm ảnh khác
                                        </Button>
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>
                    </div>

                    <Flex justify="flex-end" gap="small" style={{ marginTop: 24 }}>
                        <Button size="large" onClick={() => setIsModalVisible(false)}>
                            Hủy
                        </Button>
                        <Button size="large" type="primary" htmlType="submit">
                            {editingProduct ? "Lưu cập nhật" : "Thêm mới"}
                        </Button>
                    </Flex>
                </Form>
            </Modal>
        </>
    );
}
