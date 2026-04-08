"use client";
import React, { useEffect, useState } from "react";
import {
    Row,
    Col,
    Card,
    Tabs,
    Form,
    Input,
    Button,
    Upload,
    Avatar,
    message,
    Typography,
    Table,
    Tag,
    Spin,
    Modal,
    Space,
    Descriptions,
    Divider,
} from "antd";
import {
    UploadOutlined,
    UserOutlined,
    SettingOutlined,
    ShoppingOutlined,
    MailOutlined,
    IdcardOutlined,
    CalendarOutlined,
    SafetyCertificateOutlined,
    HistoryOutlined,
} from "@ant-design/icons";
import axios from "axios";
import api from "@/utils/axios";

const { Title, Text } = Typography;

export default function UserProfilePage() {
    const [form] = Form.useForm();
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [tempAvatar, setTempAvatar] = useState("");

    const fetchData = async () => {
        try {
            const [userRes, ordersRes, logsRes] = await Promise.all([
                api.get("/users/me"),
                api.get("/orders/me"),
                api.get("/users/logs?me=true"),
            ]);

            setUser(userRes.data);
            setOrders(ordersRes.data);
            setLogs(logsRes.data || []);
            setTempAvatar(userRes.data.avatarUrl);
        } catch (error) {
            console.error("Lỗi tải hồ sơ:", error);
            message.error("Không thể tải dữ liệu cá nhân.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const renderRoleTag = (role) => {
        const r = role?.toLowerCase();
        switch (r) {
            case "root":
                return (
                    <Tag
                        color="red"
                        icon={<SafetyCertificateOutlined />}
                        style={{ fontWeight: "bold" }}
                    >
                        ROOT
                    </Tag>
                );
            case "admin":
                return (
                    <Tag color="gold" icon={<IdcardOutlined />} style={{ fontWeight: "bold" }}>
                        ADMIN
                    </Tag>
                );
            case "seller":
                return (
                    <Tag color="green" icon={<UserOutlined />} style={{ fontWeight: "bold" }}>
                        SELLER
                    </Tag>
                );
            default:
                return (
                    <Tag color="blue" icon={<UserOutlined />} style={{ fontWeight: "bold" }}>
                        USER
                    </Tag>
                );
        }
    };

    const getStatusTag = (status) => {
        const s = status?.toUpperCase();
        if (s === "PAID" || s === "COMPLETED") return <Tag color="green">HOÀN TẤT</Tag>;
        if (s === "PENDING") return <Tag color="orange">CHỜ XỬ LÝ</Tag>;
        if (s === "SHIPPING") return <Tag color="blue">ĐANG GIAO</Tag>;
        if (s === "CANCELED" || s === "CANCELLED") return <Tag color="red">ĐÃ HỦY</Tag>;
        return <Tag color="default">{s || "N/A"}</Tag>;
    };

    const getActionTag = (action) => {
        const a = action?.toUpperCase();
        switch (a) {
            case "LOGIN":
                return <Tag color="green">ĐĂNG NHẬP</Tag>;
            case "LOGOUT":
                return <Tag color="volcano">ĐĂNG XUẤT</Tag>;
            case "ORDER_CREATED":
                return <Tag color="blue">TẠO ĐƠN HÀNG</Tag>;
            case "PAYMENT_RECEIVED":
                return <Tag color="cyan">THANH TOÁN</Tag>;
            case "ORDER_CANCELED":
                return <Tag color="magenta">HỦY ĐƠN</Tag>;
            case "SYSTEM":
                return <Tag color="purple">HỆ THỐNG</Tag>;
            default:
                return <Tag color="default">{a}</Tag>;
        }
    };

    const handleUpload = async ({ file, onSuccess, onError }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "dpwood_avatar");
        formData.append("cloud_name", "desgym0rq");

        try {
            setUploading(true);
            const res = await axios.post(
                "https://api.cloudinary.com/v1_1/desgym0rq/image/upload",
                formData,
            );
            setTempAvatar(res.data.secure_url);
            onSuccess("ok");
            message.success("Tải ảnh thành công!");
        } catch (error) {
            onError(error);
            message.error("Lỗi khi tải ảnh.");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async (values) => {
        try {
            await api.put("/users/me", { name: values.name, avatarUrl: tempAvatar });
            message.success("Cập nhật hồ sơ thành công!");
            localStorage.setItem("userName", values.name);
            if (tempAvatar) localStorage.setItem("avatarUrl", tempAvatar);
            window.dispatchEvent(new Event("storage"));
            setIsEditModalOpen(false);
            fetchData();
        } catch (error) {
            message.error("Cập nhật thất bại.");
        }
    };

    // Đã sửa lại nhận vào orderCode để khớp với Backend
    const handleCancelOrder = (orderCode) => {
        Modal.confirm({
            title: "Xác nhận hủy đơn hàng",
            content:
                "Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.",
            okText: "Hủy đơn ngay",
            okType: "danger",
            cancelText: "Quay lại",
            onOk: async () => {
                try {
                    await api.put(`/orders/${orderCode}/cancel`);
                    message.success("Đã hủy đơn hàng thành công");
                    fetchData();
                } catch (error) {
                    message.error("Không thể hủy đơn hàng lúc này");
                }
            },
        });
    };

    if (loading)
        return (
            <div
                style={{
                    height: "80vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Spin size="large" description="Đang tải dữ liệu hồ sơ..." />
            </div>
        );

    return (
        <div style={{ padding: "30px 50px", minHeight: "100vh", background: "#f0f2f5" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                {/* HEADER CARD */}
                <Card
                    variant="borderless"
                    style={{
                        marginBottom: 24,
                        borderRadius: "12px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                    }}
                >
                    <Row gutter={[24, 24]} align="middle">
                        <Col xs={24} md={6} lg={4} style={{ textAlign: "center" }}>
                            <Avatar
                                size={120}
                                icon={!user?.avatarUrl ? <UserOutlined /> : null}
                                {...(user?.avatarUrl ? { src: user.avatarUrl } : {})}
                                style={{
                                    border: "4px solid #e6f7ff",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                }}
                            />
                        </Col>
                        <Col xs={24} md={18} lg={20}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    flexWrap: "wrap",
                                }}
                            >
                                <div>
                                    <Title level={2} style={{ margin: 0 }}>
                                        {user?.name}
                                    </Title>
                                    <Space style={{ marginTop: 8 }}>
                                        {renderRoleTag(user?.role)}
                                        <Tag color="green" icon={<SafetyCertificateOutlined />}>
                                            Tài khoản tin cậy
                                        </Tag>
                                    </Space>
                                </div>
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<SettingOutlined style={{ fontSize: "20px" }} />}
                                    onClick={() => setIsEditModalOpen(true)}
                                    title="Thiết lập tài khoản"
                                    style={{
                                        borderRadius: "8px",
                                        width: "40px",
                                        height: "40px",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        boxShadow: "0 2px 8px rgba(24, 144, 255, 0.2)",
                                    }}
                                />
                            </div>
                            <Divider style={{ margin: "16px 0" }} />
                            <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
                                <Descriptions.Item
                                    label={
                                        <span>
                                            <MailOutlined /> Email
                                        </span>
                                    }
                                    style={{ width: "400px" }}
                                >
                                    {user?.email}
                                </Descriptions.Item>
                                <Descriptions.Item
                                    label={
                                        <span>
                                            <IdcardOutlined /> Quyền hạn
                                        </span>
                                    }
                                >
                                    {renderRoleTag(user?.role)}
                                </Descriptions.Item>
                                <Descriptions.Item
                                    label={
                                        <span>
                                            <CalendarOutlined /> Ngày gia nhập
                                        </span>
                                    }
                                >
                                    {new Date(user?.createdAt).toLocaleDateString("vi-VN")}
                                </Descriptions.Item>
                            </Descriptions>
                        </Col>
                    </Row>
                </Card>

                {/* TABS CONTENT */}
                <Card
                    variant="borderless"
                    style={{ borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
                >
                    <Tabs
                        defaultActiveKey="orders"
                        size="large"
                        items={[
                            {
                                key: "orders",
                                label: (
                                    <span>
                                        <ShoppingOutlined /> Đơn hàng của tôi
                                    </span>
                                ),
                                children: (
                                    <Table
                                        dataSource={orders}
                                        rowKey="id"
                                        pagination={{ pageSize: 5 }}
                                        scroll={{ x: 800 }}
                                        columns={[
                                            {
                                                title: "Mã đơn",
                                                dataIndex: "orderCode",
                                                render: (c) => <Text code>{c}</Text>,
                                            },
                                            {
                                                title: "Ngày đặt",
                                                dataIndex: "createdAt",
                                                render: (d) =>
                                                    new Date(d).toLocaleDateString("vi-VN"),
                                            },
                                            {
                                                title: "Tổng tiền",
                                                dataIndex: "totalAmount",
                                                render: (v) => (
                                                    <Text strong style={{ color: "#cf1322" }}>
                                                        {new Intl.NumberFormat("vi-VN").format(v)}₫
                                                    </Text>
                                                ),
                                            },
                                            // 🔴 Đã bổ sung cột Thanh toán
                                            {
                                                title: "Thanh toán",
                                                dataIndex: "paymentMethod",
                                                render: (method) => {
                                                    const isQR = method === "QR";
                                                    return (
                                                        <Tag color={isQR ? "cyan" : "blue"}>
                                                            {isQR ? "QR Code" : "COD"}
                                                        </Tag>
                                                    );
                                                },
                                            },
                                            {
                                                title: "Trạng thái",
                                                dataIndex: "status",
                                                render: (s) => getStatusTag(s),
                                            },
                                            {
                                                title: "Hành động",
                                                key: "action",
                                                render: (_, record) => (
                                                    <Space>
                                                        {record.status === "PENDING" && (
                                                            <Button
                                                                type="primary"
                                                                danger
                                                                size="small"
                                                                onClick={() =>
                                                                    handleCancelOrder(
                                                                        record.orderCode,
                                                                    )
                                                                }
                                                            >
                                                                Hủy đơn
                                                            </Button>
                                                        )}
                                                    </Space>
                                                ),
                                            },
                                        ]}
                                    />
                                ),
                            },
                            {
                                key: "transactions",
                                label: (
                                    <span>
                                        <HistoryOutlined /> Lịch sử hoạt động
                                    </span>
                                ),
                                children: (
                                    <Table
                                        dataSource={logs}
                                        rowKey="id"
                                        pagination={{ pageSize: 5 }}
                                        scroll={{ x: 900 }}
                                        columns={[
                                            {
                                                title: "Thời gian",
                                                dataIndex: "createdAt",
                                                width: 150,
                                                render: (d) => {
                                                    const date = new Date(d);
                                                    return (
                                                        // 🔴 Dùng div thuần để thay thế hoàn toàn thẻ Space, không lo lỗi version Antd
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                flexDirection: "column",
                                                            }}
                                                        >
                                                            <Text strong>
                                                                {date.toLocaleDateString("vi-VN")}
                                                            </Text>
                                                            <Text
                                                                type="secondary"
                                                                style={{ fontSize: "12px" }}
                                                            >
                                                                {date.toLocaleTimeString("vi-VN")}
                                                            </Text>
                                                        </div>
                                                    );
                                                },
                                            },
                                            {
                                                title: "Hành động",
                                                dataIndex: "action",
                                                width: 130,
                                                render: (a) => getActionTag(a),
                                            },
                                            // 🔴 Bóc tách nội dung bằng Regex
                                            {
                                                title: "Mã Đơn",
                                                width: 100,
                                                render: (_, record) => {
                                                    const match = record.details?.match(/#(\d{6})/);
                                                    return match ? (
                                                        <Text strong style={{ color: "#1677ff" }}>
                                                            #{match[1]}
                                                        </Text>
                                                    ) : (
                                                        <Text type="secondary">-</Text>
                                                    );
                                                },
                                            },
                                            {
                                                title: "Số tiền",
                                                width: 120,
                                                render: (_, record) => {
                                                    const match =
                                                        record.details?.match(
                                                            /(\d{1,3}(?:\.\d{3})*đ)/,
                                                        );
                                                    return match ? (
                                                        <Text type="danger" strong>
                                                            {match[1]}
                                                        </Text>
                                                    ) : (
                                                        <Text type="secondary">-</Text>
                                                    );
                                                },
                                            },
                                            {
                                                title: "Mã GD (Bank)",
                                                width: 150,
                                                render: (_, record) => {
                                                    const match =
                                                        record.details?.match(
                                                            /Mã GD:\s*([A-Za-z0-9]+)/,
                                                        );
                                                    return match ? (
                                                        <Text code>{match[1]}</Text>
                                                    ) : (
                                                        <Text type="secondary">-</Text>
                                                    );
                                                },
                                            },
                                            {
                                                title: "Ghi chú",
                                                dataIndex: "details",
                                                render: (details) => {
                                                    // Rút gọn text sau khi đã bóc dữ liệu ra các cột khác
                                                    if (!details) return "";
                                                    if (
                                                        details.includes(
                                                            "Hệ thống tự động xác nhận đã nhận",
                                                        )
                                                    ) {
                                                        return (
                                                            <Text type="success">
                                                                Xác nhận thanh toán tự động
                                                            </Text>
                                                        );
                                                    }
                                                    if (
                                                        details.includes(
                                                            "Khách hàng hủy thanh toán đơn",
                                                        )
                                                    ) {
                                                        return (
                                                            <Text type="danger">
                                                                Khách hàng yêu cầu hủy đơn
                                                            </Text>
                                                        );
                                                    }
                                                    if (details.includes("Tạo đơn hàng #")) {
                                                        return <Text>Khởi tạo đơn hàng mới</Text>;
                                                    }
                                                    return <Text>{details}</Text>;
                                                },
                                            },
                                        ]}
                                    />
                                ),
                            },
                        ]}
                    />
                </Card>
            </div>

            {/* MODAL SETTINGS */}
            <Modal
                title="Cập nhật thông tin cá nhân"
                open={isEditModalOpen}
                onCancel={() => setIsEditModalOpen(false)}
                footer={null}
                destroyOnHidden
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdateProfile}
                    initialValues={{ name: user?.name }}
                >
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                        <Avatar
                            size={100}
                            src={tempAvatar || undefined}
                            icon={!tempAvatar && <UserOutlined />}
                            style={{ marginBottom: 12 }}
                        />
                        <div>
                            <Upload
                                customRequest={handleUpload}
                                showUploadList={false}
                                accept="image/*"
                            >
                                <Button icon={<UploadOutlined />}>Thay đổi ảnh</Button>
                            </Upload>
                        </div>
                    </div>
                    <Form.Item
                        label="Tên hiển thị"
                        name="name"
                        rules={[{ required: true, message: "Vui lòng nhập tên của bạn!" }]}
                    >
                        <Input size="large" />
                    </Form.Item>
                    <Form.Item label="Email (Cố định)">
                        <Input value={user?.email} disabled size="large" />
                    </Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        block
                        size="large"
                        loading={uploading}
                        style={{ marginTop: 10 }}
                    >
                        Lưu thay đổi
                    </Button>
                </Form>
            </Modal>
        </div>
    );
}
