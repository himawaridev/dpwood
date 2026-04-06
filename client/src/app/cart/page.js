"use client";
import { useEffect, useState } from "react";
import {
    Table,
    Button,
    Typography,
    message,
    InputNumber,
    Popconfirm,
    Layout,
    Result,
    Radio,
    Space,
    Modal,
    Dropdown,
    Avatar,
    Card,
    Form,
    Input,
    Tag,
    Divider,
    Image,
} from "antd";
import {
    DeleteOutlined,
    CreditCardOutlined,
    UserOutlined,
    LogoutOutlined,
    ReloadOutlined,
    CloseCircleOutlined,
    EnvironmentOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import AppNavigation from "@/components/AppNavigation";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function CartPage() {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [paymentMethod, setPaymentMethod] = useState("COD");
    const [isQrModalVisible, setIsQrModalVisible] = useState(false);
    const [authState, setAuthState] = useState({ isAuth: false, userName: "" });

    const [orderCode, setOrderCode] = useState("");
    const [finalAmount, setFinalAmount] = useState(0);
    const [checkingPayment, setCheckingPayment] = useState(false);

    // --- STATE QUẢN LÝ ĐỊA CHỈ ---
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [addressForm] = Form.useForm();

    const router = useRouter();

    useEffect(() => {
        const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
        setCartItems(storedCart);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const name = typeof window !== "undefined" ? localStorage.getItem("userName") : "";

        if (token) {
            setAuthState({ isAuth: true, userName: name });
            fetchAddresses(); // Kéo danh sách địa chỉ ngay khi vào trang nếu đã đăng nhập
        }
    }, []);

    // --- CÁC HÀM XỬ LÝ ĐỊA CHỈ ---
    const fetchAddresses = async () => {
        try {
            const res = await api.get("/addresses");
            setAddresses(res.data);
            if (res.data.length > 0) {
                // Tự động chọn địa chỉ đầu tiên (thường là mặc định vì Backend đã sếp xếp)
                setSelectedAddress(res.data[0]);
            }
        } catch (error) {
            console.log("Không thể tải địa chỉ");
        }
    };

    const handleSaveNewAddress = async (values) => {
        try {
            const res = await api.post("/addresses", { ...values, isDefault: true });
            message.success("Đã thêm địa chỉ mới!");
            setIsAddingAddress(false);
            addressForm.resetFields();
            fetchAddresses(); // Tải lại danh sách
        } catch (error) {
            message.error("Lỗi khi thêm địa chỉ");
        }
    };

    // --- CÁC HÀM XỬ LÝ GIỎ HÀNG ---
    const saveCart = (newCart) => {
        setCartItems(newCart);
        localStorage.setItem("cart", JSON.stringify(newCart));
    };

    const handleQuantityChange = (value, productId) => {
        const newCart = cartItems.map((item) =>
            item.productId === productId ? { ...item, quantity: value } : item,
        );
        saveCart(newCart);
    };

    const handleRemoveItem = (productId) => {
        const newCart = cartItems.filter((item) => item.productId !== productId);
        saveCart(newCart);
        message.success("Đã xóa sản phẩm khỏi giỏ");
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

    const handleCheckout = async () => {
        if (!authState.isAuth) {
            message.warning("Vui lòng đăng nhập để thanh toán!");
            router.push("/login");
            return;
        }

        if (!selectedAddress) {
            message.error("Vui lòng chọn hoặc thêm địa chỉ giao hàng!");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                items: cartItems.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                })),
                paymentMethod: paymentMethod,
                shippingInfo: {
                    recipientName: selectedAddress.recipientName,
                    phoneNumber: selectedAddress.phoneNumber,
                    fullAddress: selectedAddress.fullAddress,
                },
            };

            setFinalAmount(totalPrice);

            const response = await api.post("/orders/checkout", payload);
            setOrderCode(response.data.orderCode);

            if (paymentMethod === "QR") {
                setIsQrModalVisible(true);
            } else {
                localStorage.removeItem("cart");
                setCartItems([]);
                setIsSuccess(true);
            }
        } catch (error) {
            message.error(error.response?.data?.message || "Lỗi thanh toán");
        } finally {
            setLoading(false);
        }
    };

    const handleCheckPayment = async () => {
        try {
            setCheckingPayment(true);
            const response = await api.get(`/orders/${orderCode}/status`);

            if (response.data.status === "PAID") {
                message.success("Nhận tiền thành công!");
                setIsQrModalVisible(false);
                localStorage.removeItem("cart");
                setCartItems([]);
                setIsSuccess(true);
            } else {
                message.warning("Hệ thống chưa nhận được tiền. Vui lòng chờ 1-2 phút và thử lại!");
            }
        } catch (error) {
            message.error("Lỗi kết nối khi kiểm tra");
        } finally {
            setCheckingPayment(false);
        }
    };

    const handleCancelPayment = async () => {
        try {
            await api.put(`/orders/${orderCode}/cancel`);
            setIsQrModalVisible(false);
            message.info("Đã hủy thanh toán. Giỏ hàng của bạn vẫn được giữ nguyên.");
        } catch (error) {
            message.error("Lỗi khi hủy giao dịch");
        }
    };

    const columns = [
        {
            title: "Sản phẩm",
            key: "product",
            render: (_, record) => (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Image
                        src={record.imageUrl || "https://via.placeholder.com/50"}
                        alt={record.name}
                        width={50}
                        height={50}
                        style={{ objectFit: "cover", borderRadius: 4 }}
                        preview={false}
                    />
                    <Text strong>{record.name}</Text>
                </div>
            ),
        },
        {
            title: "Đơn giá",
            dataIndex: "price",
            render: (price) =>
                new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                    price,
                ),
        },
        {
            title: "Số lượng",
            render: (_, record) => (
                <InputNumber
                    min={1}
                    max={99}
                    value={record.quantity}
                    onChange={(val) => handleQuantityChange(val, record.productId)}
                />
            ),
        },
        {
            title: "Thành tiền",
            render: (_, record) => (
                <Text type="danger" strong>
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                        record.price * record.quantity,
                    )}
                </Text>
            ),
        },
        {
            title: "Hành động",
            render: (_, record) => (
                <Popconfirm title="Xóa?" onConfirm={() => handleRemoveItem(record.productId)}>
                    <Button danger icon={<DeleteOutlined />} type="text" />
                </Popconfirm>
            ),
        },
    ];

    const CustomHeader = () => (
        <Header
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#001529",
                padding: "0 40px",
                position: "sticky",
                top: 0,
                zIndex: 1,
            }}
        >
            <div style={{ display: "flex", alignItems: "center" }}>
                <div
                    style={{
                        color: "#fff",
                        fontSize: 22,
                        fontWeight: "bold",
                        cursor: "pointer",
                        marginRight: 24,
                        letterSpacing: 1,
                    }}
                    onClick={() => router.push("/")}
                >
                    DPWOOD
                </div>
                <AppNavigation />
            </div>
            {authState.isAuth ? (
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
                >
                    <div
                        style={{
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            color: "white",
                        }}
                    >
                        <Avatar
                            style={{ backgroundColor: "#1677ff", marginRight: 8 }}
                            icon={<UserOutlined />}
                        />
                        <span style={{ fontWeight: 500 }}>{authState.userName}</span>
                    </div>
                </Dropdown>
            ) : (
                <Button type="primary" onClick={() => router.push("/login")}>
                    Đăng nhập
                </Button>
            )}
        </Header>
    );

    if (isSuccess) {
        return (
            <Layout style={{ minHeight: "100vh" }}>
                <CustomHeader />
                <Content
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "80vh",
                        background: "#f0f2f5",
                    }}
                >
                    <Result
                        status="success"
                        title="Đặt hàng thành công!"
                        subTitle={`Mã đơn hàng của bạn là: #${orderCode}. Chúng tôi sẽ sớm giao hàng đến: ${selectedAddress?.fullAddress}`}
                        extra={[
                            <Button type="primary" key="home" onClick={() => router.push("/")}>
                                Về trang chủ
                            </Button>,
                            <Button key="buy" onClick={() => router.push("/products")}>
                                Tiếp tục mua sắm
                            </Button>,
                        ]}
                    />
                </Content>
            </Layout>
        );
    }

    return (
        <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
            <CustomHeader />
            <Content style={{ padding: "40px", maxWidth: 1000, margin: "0 auto", width: "100%" }}>
                <Title level={2}>Giỏ hàng của bạn</Title>

                {cartItems.length > 0 && authState.isAuth && (
                    <Card
                        style={{ marginBottom: 20, borderColor: "#1677ff", borderWidth: 2 }}
                        styles={{ body: { padding: "16px 24px" } }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                            }}
                        >
                            <div>
                                <Title level={5} style={{ color: "#1677ff", marginTop: 0 }}>
                                    <EnvironmentOutlined /> Địa chỉ nhận hàng
                                </Title>
                                {selectedAddress ? (
                                    <Space size="large">
                                        <Text strong>
                                            {selectedAddress.recipientName} (+84){" "}
                                            {selectedAddress.phoneNumber.replace(/^0/, "")}
                                        </Text>
                                        <Text>{selectedAddress.fullAddress}</Text>
                                        {selectedAddress.isDefault && (
                                            <Tag color="blue">Mặc định</Tag>
                                        )}
                                    </Space>
                                ) : (
                                    <Text type="danger">Bạn chưa chọn địa chỉ giao hàng nào.</Text>
                                )}
                            </div>
                            <Button type="link" onClick={() => setIsAddressModalVisible(true)}>
                                {selectedAddress ? "Thay đổi" : "Thêm địa chỉ"}
                            </Button>
                        </div>
                    </Card>
                )}

                <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
                    <Table
                        dataSource={cartItems}
                        columns={columns}
                        rowKey="productId"
                        pagination={false}
                        locale={{ emptyText: "Giỏ hàng đang trống" }}
                    />

                    {cartItems.length > 0 && (
                        <div
                            style={{
                                marginTop: 24,
                                borderTop: "1px solid #f0f0f0",
                                paddingTop: 24,
                            }}
                        >
                            <div style={{ marginBottom: 20 }}>
                                <Title level={5}>Phương thức thanh toán:</Title>
                                <Radio.Group
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    value={paymentMethod}
                                >
                                    <Space orientation="vertical">
                                        <Radio value="COD">Thanh toán khi nhận hàng (COD)</Radio>
                                        <Radio value="QR">
                                            Chuyển khoản qua mã QR (Tự động xác nhận)
                                        </Radio>
                                    </Space>
                                </Radio.Group>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <Title level={4} style={{ margin: 0 }}>
                                    Tổng cộng:{" "}
                                    <Text type="danger" style={{ fontSize: 24 }}>
                                        {new Intl.NumberFormat("vi-VN", {
                                            style: "currency",
                                            currency: "VND",
                                        }).format(totalPrice)}
                                    </Text>
                                </Title>
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<CreditCardOutlined />}
                                    onClick={handleCheckout}
                                    loading={loading}
                                >
                                    Tiến hành Đặt hàng
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Content>

            {/* Modal Quản Lý Địa Chỉ */}
            <Modal
                title={isAddingAddress ? "Thêm địa chỉ mới" : "Địa chỉ của tôi"}
                open={isAddressModalVisible}
                onCancel={() => {
                    setIsAddressModalVisible(false);
                    setIsAddingAddress(false);
                }}
                footer={null}
                width={600}
            >
                {isAddingAddress ? (
                    <Form form={addressForm} layout="vertical" onFinish={handleSaveNewAddress}>
                        <Form.Item
                            name="recipientName"
                            label="Họ và tên"
                            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
                        >
                            <Input placeholder="Tên người nhận" />
                        </Form.Item>
                        <Form.Item
                            name="phoneNumber"
                            label="Số điện thoại"
                            rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
                        >
                            <Input placeholder="Số điện thoại liên hệ" />
                        </Form.Item>
                        <Form.Item
                            name="fullAddress"
                            label="Địa chỉ cụ thể"
                            rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
                        >
                            <Input.TextArea
                                rows={3}
                                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                            />
                        </Form.Item>
                        <Space
                            style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}
                        >
                            <Button onClick={() => setIsAddingAddress(false)}>Trở lại</Button>
                            <Button type="primary" htmlType="submit">
                                Hoàn thành
                            </Button>
                        </Space>
                    </Form>
                ) : (
                    <div>
                        {addresses.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "20px 0" }}>
                                <Text type="secondary">Chưa có địa chỉ nào được lưu.</Text>
                            </div>
                        ) : (
                            <Radio.Group
                                style={{ width: "100%" }}
                                value={selectedAddress?.id}
                                onChange={(e) =>
                                    setSelectedAddress(
                                        addresses.find((a) => a.id === e.target.value),
                                    )
                                }
                            >
                                <Space orientation="vertical" style={{ width: "100%" }}>
                                    {addresses.map((addr) => (
                                        <Card
                                            key={addr.id}
                                            size="small"
                                            style={{
                                                width: "100%",
                                                borderColor:
                                                    selectedAddress?.id === addr.id
                                                        ? "#1677ff"
                                                        : "#f0f0f0",
                                            }}
                                        >
                                            <Radio
                                                value={addr.id}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                }}
                                            >
                                                <div style={{ marginLeft: 8 }}>
                                                    <Text strong>{addr.recipientName}</Text>{" "}
                                                    <Divider orientation="vertical" />{" "}
                                                    <Text type="secondary">{addr.phoneNumber}</Text>
                                                    <div style={{ marginTop: 4 }}>
                                                        {addr.fullAddress}
                                                    </div>
                                                    {addr.isDefault && (
                                                        <Tag color="blue" style={{ marginTop: 8 }}>
                                                            Mặc định
                                                        </Tag>
                                                    )}
                                                </div>
                                            </Radio>
                                        </Card>
                                    ))}
                                </Space>
                            </Radio.Group>
                        )}
                        <Button
                            type="dashed"
                            block
                            icon={<PlusOutlined />}
                            onClick={() => setIsAddingAddress(true)}
                            style={{ marginTop: 20 }}
                        >
                            Thêm Địa Chỉ Mới
                        </Button>
                        <Button
                            type="primary"
                            block
                            onClick={() => setIsAddressModalVisible(false)}
                            style={{ marginTop: 10 }}
                        >
                            Xác nhận
                        </Button>
                    </div>
                )}
            </Modal>

            {/* Modal Quét Mã QR */}
            <Modal
                title="Thanh toán qua mã QR"
                open={isQrModalVisible}
                footer={null}
                closable={false}
                mask={{ closable: false }}
                centered
            >
                <div style={{ textAlign: "center" }}>
                    <Text>Vui lòng dùng App Ngân hàng quét mã dưới đây để thanh toán.</Text>
                    <br />
                    <Text type="secondary">Mã đơn hàng sẽ tự động hủy nếu đóng hộp thoại này.</Text>

                    <div style={{ margin: "20px 0" }}>
                        <Image
                            src={`https://img.vietqr.io/image/970436-0987654321-compact2.png?amount=${finalAmount}&addInfo=DPWOOD${orderCode}&accountName=DPWOOD_STORE`}
                            alt="QR Code"
                            width="100%"
                            style={{
                                maxWidth: 300,
                                border: "1px solid #d9d9d9",
                                borderRadius: 8,
                                padding: 10,
                            }}
                            preview={false}
                        />
                    </div>

                    <div
                        style={{
                            background: "#f5f5f5",
                            padding: 10,
                            borderRadius: 4,
                            textAlign: "left",
                            marginBottom: 20,
                        }}
                    >
                        <p>
                            <strong>Ngân hàng:</strong> Vietcombank
                        </p>
                        <p>
                            <strong>Số tài khoản:</strong> 0987654321
                        </p>
                        <p>
                            <strong>Số tiền:</strong>{" "}
                            <Text type="danger" strong>
                                {new Intl.NumberFormat("vi-VN").format(finalAmount)} VNĐ
                            </Text>
                        </p>
                        <p>
                            <strong>Nội dung:</strong> DPWOOD{orderCode}
                        </p>
                    </div>

                    <Space orientation="vertical" style={{ width: "100%" }}>
                        <Button
                            type="primary"
                            block
                            size="large"
                            icon={<ReloadOutlined />}
                            loading={checkingPayment}
                            onClick={handleCheckPayment}
                        >
                            Kiểm tra trạng thái nhận tiền
                        </Button>
                        <Button
                            block
                            size="large"
                            icon={<CloseCircleOutlined />}
                            onClick={handleCancelPayment}
                            danger
                        >
                            Hủy thanh toán & Đóng
                        </Button>
                    </Space>
                </div>
            </Modal>
        </Layout>
    );
}
