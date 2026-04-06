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
    Space,
    Layout,
    Menu,
    Dropdown,
    Avatar,
    Typography,
    theme,
    Image,
} from "antd";
import {
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    AppstoreAddOutlined,
    TeamOutlined,
    DashboardOutlined,
    HomeOutlined,
    LogoutOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

export default function AdminProductsPage() {
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();
    const [adminName, setAdminName] = useState("");

    // State quản lý sản phẩm
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // State quản lý Modal thêm/sửa
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
        const name = typeof window !== "undefined" ? localStorage.getItem("userName") : "Admin";
        setAdminName(name);
    }, []);

    const handleLogout = async () => {
        try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) await api.post("/auth/logout", { refreshToken });
        } catch (error) {
        } finally {
            localStorage.clear();
            router.push("/login");
        }
    };

    // Mở Modal để Thêm mới
    const handleAdd = () => {
        setEditingProduct(null);
        setIsModalVisible(true);
    };

    // Mở Modal để Sửa
    const handleEdit = (record) => {
        setEditingProduct(record);
        setIsModalVisible(true);
    };

    useEffect(() => {
        if (isModalVisible) {
            // Cần một độ trễ nhỏ (setTimeout) để đảm bảo Modal đã render xong Form
            setTimeout(() => {
                if (editingProduct) {
                    form.setFieldsValue(editingProduct); // Điền dữ liệu cũ để sửa
                } else {
                    form.resetFields(); // Xóa trắng để thêm mới
                }
            }, 0);
        }
    }, [isModalVisible, editingProduct, form]);

    // Gửi dữ liệu (Lưu thêm mới hoặc Cập nhật)
    const handleSave = async (values) => {
        try {
            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, values);
                message.success("Cập nhật sản phẩm thành công");
            } else {
                await api.post("/products", values);
                message.success("Thêm sản phẩm thành công");
            }
            setIsModalVisible(false);
            fetchProducts();
        } catch (error) {
            // 🔴 ĐÃ SỬA: Lấy chính xác câu báo lỗi từ Backend gửi về
            const errorMsg =
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Lỗi không xác định";
            message.error(`Lỗi: ${errorMsg}`);
            console.log("Chi tiết lỗi Backend:", error.response?.data);
        }
    };

    // Xóa sản phẩm
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
            dataIndex: "imageUrl",
            key: "imageUrl",
            render: (url) =>
                url ? (
                    <Image
                        src={url}
                        alt="product"
                        width={50}
                        height={50}
                        style={{ objectFit: "cover", borderRadius: 4 }}
                    />
                ) : (
                    "Chưa có ảnh"
                ),
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
                <Space>
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
                </Space>
            ),
        },
    ];

    const sidebarMenuItems = [
        { key: "dashboard", icon: <DashboardOutlined />, label: "Tổng quan (Sắp có)" },
        {
            key: "users",
            icon: <TeamOutlined />,
            label: "Quản lý Người Dùng",
            onClick: () => router.push("/admin/users"),
        },
        { key: "products", icon: <AppstoreAddOutlined />, label: "Quản lý Sản Phẩm" },
        { type: "divider" },
        {
            key: "home",
            icon: <HomeOutlined />,
            label: "Về Trang Chủ",
            onClick: () => router.push("/"),
        },
    ];

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Sider trigger={null} collapsible collapsed={collapsed} theme="dark" width={250}>
                <div
                    style={{
                        height: 64,
                        margin: 16,
                        color: "white",
                        fontSize: collapsed ? "12px" : "20px",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {collapsed ? "DP" : "DPWOOD ADMIN"}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    defaultSelectedKeys={["products"]}
                    items={sidebarMenuItems}
                />
            </Sider>

            <Layout>
                <Header
                    style={{
                        padding: 0,
                        background: colorBgContainer,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingRight: "24px",
                    }}
                >
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ fontSize: "16px", width: 64, height: 64 }}
                    />
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: "logout",
                                    danger: true,
                                    icon: <LogoutOutlined />,
                                    label: "Đăng xuất",
                                    onClick: handleLogout,
                                },
                            ],
                        }}
                        placement="bottomRight"
                        arrow
                    >
                        <div
                            style={{
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <Avatar
                                style={{ backgroundColor: "#f56a00" }}
                                icon={<UserOutlined />}
                            />
                            <span style={{ fontWeight: 500 }}>{adminName}</span>
                        </div>
                    </Dropdown>
                </Header>

                <Content
                    style={{
                        margin: "24px 16px",
                        padding: 24,
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 20,
                        }}
                    >
                        <Title level={3} style={{ margin: 0 }}>
                            Danh Sách Sản Phẩm
                        </Title>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                            onClick={handleAdd}
                        >
                            Thêm Sản Phẩm Mới
                        </Button>
                    </div>

                    <Table
                        dataSource={products}
                        columns={columns}
                        rowKey="id"
                        loading={loading}
                        scroll={{ x: 800 }}
                    />

                    {/* Modal Thêm/Sửa Sản Phẩm */}
                    <Modal
                        title={editingProduct ? "Cập Nhật Sản Phẩm" : "Thêm Sản Phẩm Mới"}
                        open={isModalVisible}
                        onCancel={() => setIsModalVisible(false)}
                        footer={null}
                        destroyOnHidden
                    >
                        <Form form={form} layout="vertical" onFinish={handleSave}>
                            <Form.Item
                                name="name"
                                label="Tên sản phẩm"
                                rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm" }]}
                            >
                                <Input placeholder="VD: Bàn gỗ Sồi cao cấp" />
                            </Form.Item>

                            <Form.Item name="description" label="Mô tả sản phẩm">
                                <Input.TextArea
                                    rows={4}
                                    placeholder="Nhập thông tin chi tiết về sản phẩm..."
                                />
                            </Form.Item>

                            <Space style={{ display: "flex", marginBottom: 8 }} align="baseline">
                                <Form.Item
                                    name="price"
                                    label="Giá bán (VNĐ)"
                                    rules={[{ required: true, message: "Vui lòng nhập giá" }]}
                                >
                                    <InputNumber
                                        style={{ width: "200px" }}
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
                                >
                                    <InputNumber style={{ width: "150px" }} min={0} />
                                </Form.Item>
                            </Space>

                            <Form.Item name="imageUrl" label="Đường dẫn ảnh (URL)">
                                <Input placeholder="https://example.com/image.jpg" />
                            </Form.Item>

                            <Form.Item style={{ textAlign: "right", marginTop: 20 }}>
                                <Button
                                    onClick={() => setIsModalVisible(false)}
                                    style={{ marginRight: 8 }}
                                >
                                    Hủy
                                </Button>
                                <Button type="primary" htmlType="submit">
                                    Lưu lại
                                </Button>
                            </Form.Item>
                        </Form>
                    </Modal>
                </Content>
            </Layout>
        </Layout>
    );
}
