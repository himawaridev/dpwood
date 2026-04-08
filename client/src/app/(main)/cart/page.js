"use client";
import { useEffect, useState } from "react";
import {
    Table,
    Button,
    Typography,
    message,
    InputNumber,
    Popconfirm,
    Result,
    Radio,
    Space,
    Modal,
    Card,
    Form,
    Input,
    Tag,
    Divider,
    Image,
    Descriptions,
    Flex,
    Alert,
} from "antd";
import {
    DeleteOutlined,
    CreditCardOutlined,
    ReloadOutlined,
    CloseCircleOutlined,
    EnvironmentOutlined,
    PlusOutlined,
    InfoCircleOutlined,
    MailOutlined,
    ShoppingCartOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";

const { Title, Text } = Typography;

export default function CartPage() {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("COD");
    const [payosData, setPayosData] = useState(null);

    const [isQrModalVisible, setIsQrModalVisible] = useState(false);
    const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);

    const [isAuth, setIsAuth] = useState(false);
    const [userEmail, setUserEmail] = useState("");
    const [orderCode, setOrderCode] = useState("");
    const [finalAmount, setFinalAmount] = useState(0);
    const [checkingPayment, setCheckingPayment] = useState(false);

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
        if (token) {
            setIsAuth(true);
            setUserEmail(localStorage.getItem("userEmail") || "Email của bạn");
            fetchAddresses();
        }
    }, []);

    const fetchAddresses = async () => {
        try {
            const res = await api.get("/addresses");
            setAddresses(res.data);
            if (res.data.length > 0) setSelectedAddress(res.data[0]);
        } catch (error) {
            console.log("Không thể tải địa chỉ");
        }
    };

    const handleSaveNewAddress = async (values) => {
        try {
            await api.post("/addresses", { ...values, isDefault: true });
            message.success("Đã thêm địa chỉ mới!");
            setIsAddingAddress(false);
            addressForm.resetFields();
            fetchAddresses();
        } catch (error) {
            message.error("Lỗi khi thêm địa chỉ");
        }
    };

    const handleDeleteAddress = async (id) => {
        try {
            await api.delete(`/addresses/${id}`);
            message.success("Đã xóa địa chỉ thành công!");
            if (selectedAddress?.id === id) {
                setSelectedAddress(null);
            }
            fetchAddresses();
        } catch (error) {
            message.error("Không thể xóa địa chỉ lúc này.");
        }
    };

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

    const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

    const handleCheckoutClick = () => {
        if (!isAuth) {
            message.warning("Vui lòng đăng nhập để thanh toán!");
            router.push("/login");
            return;
        }
        if (!selectedAddress) {
            message.error("Vui lòng chọn hoặc thêm địa chỉ giao hàng!");
            return;
        }
        setIsConfirmModalVisible(true);
    };

    const confirmOrder = async () => {
        try {
            setLoading(true);
            setIsConfirmModalVisible(false);

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
                setOrderCode(response.data.orderCode);
                setPayosData(response.data.paymentLink);
                setIsQrModalVisible(true);
            } else {
                localStorage.removeItem("cart");
                setCartItems([]);
                setIsSuccess(true);
            }
        } catch (error) {
            message.error(error.response?.data?.message || "Lỗi khi tạo đơn hàng");
            setIsConfirmModalVisible(true);
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
                message.warning("Hệ thống chưa nhận được tiền. Vui lòng chờ 1-2 phút!");
            }
        } catch (error) {
            message.error("Lỗi kết nối");
        } finally {
            setCheckingPayment(false);
        }
    };

    const handleCancelPayment = async () => {
        try {
            await api.put(`/orders/${orderCode}/cancel`);
            setIsQrModalVisible(false);
            message.info("Đã hủy thanh toán. Giỏ hàng của bạn được giữ nguyên.");
        } catch (error) {
            message.error("Lỗi khi hủy giao dịch");
        }
    };

    const columns = [
        {
            title: "Sản phẩm",
            render: (_, record) => (
                <Flex align="center" gap="middle">
                    <Image
                        src={record.imageUrl || "https://via.placeholder.com/50"}
                        alt={record.name || "Sản phẩm"}
                        width={60}
                        height={60}
                        preview={false}
                        style={{ borderRadius: 8, objectFit: "cover", border: "1px solid #f0f0f0" }}
                    />
                    <Text strong style={{ fontSize: "15px", color: "#262626" }}>
                        {record.name}
                    </Text>
                </Flex>
            ),
        },
        {
            title: "Đơn giá",
            dataIndex: "price",
            align: "right", // 🔴 Căn lề phải
            width: 130, // 🔴 Cố định width
            render: (p) => (
                // 🔴 Thêm tabular-nums để cố định chiều ngang chữ số
                <Text type="secondary" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {new Intl.NumberFormat("vi-VN").format(p)}₫
                </Text>
            ),
        },
        {
            title: "Số lượng",
            align: "center", // 🔴 Căn giữa cho đẹp
            width: 120, // 🔴 Cố định width
            render: (_, record) => (
                <InputNumber
                    min={1}
                    max={99}
                    value={record.quantity}
                    onChange={(val) => handleQuantityChange(val, record.productId)}
                    size="middle"
                />
            ),
        },
        {
            title: "Thành tiền",
            align: "right", // 🔴 Căn lề phải
            width: 150, // 🔴 Cố định width
            render: (_, record) => (
                // 🔴 Thêm tabular-nums
                <Text
                    strong
                    style={{
                        color: "#1677ff",
                        fontSize: "16px",
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    {new Intl.NumberFormat("vi-VN").format(record.price * record.quantity)}₫
                </Text>
            ),
        },
        {
            title: "",
            align: "center",
            width: 60,
            render: (_, record) => (
                <Popconfirm
                    title="Xóa sản phẩm này khỏi giỏ hàng?"
                    onConfirm={() => handleRemoveItem(record.productId)}
                    okText="Xóa"
                    cancelText="Hủy"
                >
                    <Button danger icon={<DeleteOutlined />} type="text" shape="circle" />
                </Popconfirm>
            ),
        },
    ];

    if (isSuccess)
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "60vh",
                    background: "#f0f2f5",
                }}
            >
                <Card style={{ borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
                    <Result
                        status="success"
                        title="Đặt hàng thành công!"
                        subTitle={`Mã đơn hàng: #${orderCode}. Hóa đơn điện tử sẽ được gửi về email của bạn.`}
                        extra={[
                            <Button
                                type="primary"
                                key="home"
                                onClick={() => router.push("/")}
                                size="large"
                            >
                                Về trang chủ
                            </Button>,
                            <Button key="buy" onClick={() => router.push("/products")} size="large">
                                Tiếp tục mua sắm
                            </Button>,
                        ]}
                    />
                </Card>
            </div>
        );

    return (
        <div style={{ padding: "40px 20px", background: "#f0f2f5", minHeight: "100vh" }}>
            <div style={{ maxWidth: 1000, margin: "0 auto", width: "100%" }}>
                <Title level={2} style={{ color: "#001529", marginBottom: 24 }}>
                    <ShoppingCartOutlined style={{ color: "#1677ff", marginRight: 12 }} />
                    Giỏ hàng của bạn
                </Title>

                {cartItems.length > 0 && isAuth && (
                    <Card
                        variant="borderless"
                        style={{
                            marginBottom: 24,
                            borderRadius: 12,
                            border: "2px solid #91caff",
                            boxShadow: "0 4px 12px rgba(22, 119, 255, 0.05)",
                        }}
                        styles={{ body: { padding: "20px 24px" } }}
                    >
                        <Flex justify="space-between" align="flex-start" wrap="wrap" gap="middle">
                            <div>
                                <Title
                                    level={5}
                                    style={{
                                        color: "#1677ff",
                                        marginTop: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
                                    <EnvironmentOutlined /> Địa chỉ nhận hàng
                                </Title>
                                {selectedAddress ? (
                                    <Space size="middle" wrap>
                                        <Text strong style={{ fontSize: "16px" }}>
                                            {selectedAddress.recipientName} (+84){" "}
                                            {selectedAddress.phoneNumber.replace(/^0/, "")}
                                        </Text>
                                        <span
                                            style={{
                                                display: "inline-block",
                                                width: "1px",
                                                height: "14px",
                                                backgroundColor: "#d9d9d9",
                                                margin: "0 2px",
                                                verticalAlign: "middle",
                                            }}
                                        />

                                        <Text>{selectedAddress.fullAddress}</Text>

                                        {selectedAddress.isDefault && (
                                            <Tag color="blue" variant="solid">
                                                Mặc định
                                            </Tag>
                                        )}
                                    </Space>
                                ) : (
                                    <Text type="danger">
                                        Vui lòng thêm địa chỉ giao hàng để tiếp tục.
                                    </Text>
                                )}
                            </div>
                            <Button type="default" onClick={() => setIsAddressModalVisible(true)}>
                                {selectedAddress ? "Thay đổi địa chỉ" : "Thêm địa chỉ"}
                            </Button>
                        </Flex>
                    </Card>
                )}

                <Card
                    variant="borderless"
                    style={{ borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
                    styles={{ body: { padding: 0 } }}
                >
                    <Table
                        dataSource={cartItems}
                        columns={columns}
                        rowKey="productId"
                        pagination={false}
                        scroll={{ x: 600 }}
                        locale={{ emptyText: "Giỏ hàng đang trống" }}
                        style={{
                            borderBottom: cartItems.length > 0 ? "1px solid #f0f0f0" : "none",
                        }}
                    />

                    {cartItems.length > 0 && (
                        <div
                            style={{
                                padding: "24px 32px",
                                background: "#fafafa",
                                borderBottomLeftRadius: 12,
                                borderBottomRightRadius: 12,
                            }}
                        >
                            <Flex
                                justify="space-between"
                                align="flex-start"
                                wrap="wrap"
                                gap="large"
                            >
                                <div>
                                    <Title level={5} style={{ color: "#595959", marginBottom: 16 }}>
                                        Phương thức thanh toán:
                                    </Title>
                                    <Radio.Group
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        value={paymentMethod}
                                    >
                                        <Flex vertical gap="middle">
                                            <Radio value="COD">
                                                <Text strong={paymentMethod === "COD"}>
                                                    Thanh toán khi nhận hàng (COD)
                                                </Text>
                                            </Radio>
                                            <Radio value="QR">
                                                <Text strong={paymentMethod === "QR"}>
                                                    Chuyển khoản qua mã QR (Tự động xác nhận)
                                                </Text>
                                            </Radio>
                                        </Flex>
                                    </Radio.Group>
                                </div>

                                <Flex vertical align="flex-end" gap="middle">
                                    <div>
                                        <Text
                                            style={{
                                                fontSize: "16px",
                                                color: "#595959",
                                                marginRight: 12,
                                            }}
                                        >
                                            Tổng thanh toán:
                                        </Text>
                                        <Text
                                            strong
                                            style={{
                                                fontSize: "28px",
                                                color: "#1677ff",
                                                lineHeight: 1,
                                                fontVariantNumeric: "tabular-nums", // 🔴 Thêm vào tổng tiền lớn
                                            }}
                                        >
                                            {new Intl.NumberFormat("vi-VN").format(totalPrice)}₫
                                        </Text>
                                    </div>
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<CreditCardOutlined />}
                                        onClick={handleCheckoutClick}
                                        loading={loading}
                                        style={{
                                            height: 48,
                                            fontSize: "16px",
                                            padding: "0 32px",
                                            borderRadius: 8,
                                        }}
                                    >
                                        Tiến hành Đặt hàng
                                    </Button>
                                </Flex>
                            </Flex>
                        </div>
                    )}
                </Card>
            </div>

            <Modal
                title={
                    <span style={{ fontSize: "18px", color: "#001529" }}>
                        <InfoCircleOutlined style={{ color: "#1677ff", marginRight: 8 }} />
                        Xác nhận thông tin đơn hàng
                    </span>
                }
                open={isConfirmModalVisible}
                onOk={confirmOrder}
                confirmLoading={loading}
                onCancel={() => setIsConfirmModalVisible(false)}
                okText="Chốt đơn hàng"
                cancelText="Quay lại kiểm tra"
                width={850}
                centered
            >
                <div style={{ padding: "10px 0" }}>
                    <Descriptions
                        title="Thông tin giao hàng"
                        bordered
                        size="small"
                        column={{ xs: 1, sm: 2, md: 3 }}
                    >
                        <Descriptions.Item label="Người nhận">
                            <Text strong>{selectedAddress?.recipientName}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Số điện thoại">
                            <Text strong>{selectedAddress?.phoneNumber}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Phương thức">
                            <Tag color={paymentMethod === "COD" ? "blue" : "cyan"}>
                                {paymentMethod === "COD" ? "COD" : "QR"}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Địa chỉ giao" span={3}>
                            {selectedAddress?.fullAddress}
                        </Descriptions.Item>
                    </Descriptions>

                    <Divider titlePlacement="left" style={{ marginTop: 24 }}>
                        Sản phẩm đã chọn
                    </Divider>
                    <Table
                        dataSource={cartItems}
                        pagination={false}
                        size="small"
                        scroll={{ y: 240 }}
                        rowKey="productId"
                        columns={[
                            { title: "Tên sản phẩm", dataIndex: "name" },
                            { title: "SL", dataIndex: "quantity", width: 60, align: "center" },
                            {
                                title: "Thành tiền",
                                width: 150,
                                align: "right", // 🔴 Căn lề phải
                                render: (r) => (
                                    <Text
                                        strong
                                        style={{
                                            color: "#1677ff",
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {new Intl.NumberFormat("vi-VN").format(
                                            r.price * r.quantity,
                                        )}
                                        ₫
                                    </Text>
                                ),
                            },
                        ]}
                    />

                    <Flex justify="flex-end" style={{ marginTop: 16 }}>
                        <Title level={4} style={{ margin: 0, color: "#262626" }}>
                            Tổng cộng:{" "}
                            <Text
                                style={{
                                    color: "#1677ff",
                                    fontSize: "24px",
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {new Intl.NumberFormat("vi-VN").format(totalPrice)}₫
                            </Text>
                        </Title>
                    </Flex>

                    <div
                        style={{
                            marginTop: 24,
                            background: "#e6f4ff",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            border: "1px solid #91caff",
                        }}
                    >
                        <Text strong style={{ color: "#0958d9" }}>
                            <MailOutlined /> Thông báo quan trọng:
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: "13px", color: "#1677ff" }}>
                            Trạng thái đơn hàng và hóa đơn điện tử sẽ được gửi tự động về Email tài
                            khoản của bạn. Vui lòng kiểm tra lại để chắc chắn số lượng và địa chỉ đã
                            chính xác.
                        </Text>
                    </div>
                </div>
            </Modal>

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
                    <Form
                        form={addressForm}
                        layout="vertical"
                        onFinish={handleSaveNewAddress}
                        style={{ marginTop: 16 }}
                    >
                        <Form.Item
                            name="recipientName"
                            label="Họ và tên"
                            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                        >
                            <Input size="large" placeholder="Tên người nhận" />
                        </Form.Item>
                        <Form.Item
                            name="phoneNumber"
                            label="Số điện thoại"
                            rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
                        >
                            <Input size="large" placeholder="Số điện thoại liên hệ" />
                        </Form.Item>
                        <Form.Item
                            name="fullAddress"
                            label="Địa chỉ cụ thể"
                            rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
                        >
                            <Input.TextArea
                                size="large"
                                rows={3}
                                placeholder="Số nhà, đường, phường, quận..."
                            />
                        </Form.Item>
                        <Flex justify="flex-end" gap="small">
                            <Button size="large" onClick={() => setIsAddingAddress(false)}>
                                Quay lại
                            </Button>
                            <Button size="large" type="primary" htmlType="submit">
                                Hoàn thành
                            </Button>
                        </Flex>
                    </Form>
                ) : (
                    <div style={{ marginTop: 16 }}>
                        {addresses.length === 0 ? (
                            <Text type="secondary">Bạn chưa có địa chỉ nào. Hãy thêm mới nhé.</Text>
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
                                <Flex vertical gap="middle" style={{ width: "100%" }}>
                                    {addresses.map((addr) => (
                                        <Card
                                            key={addr.id}
                                            size="small"
                                            hoverable
                                            onClick={() => setSelectedAddress(addr)}
                                            style={{
                                                borderColor:
                                                    selectedAddress?.id === addr.id
                                                        ? "#1677ff"
                                                        : "#d9d9d9",
                                                background:
                                                    selectedAddress?.id === addr.id
                                                        ? "#e6f4ff"
                                                        : "#fff",
                                                cursor: "pointer",
                                            }}
                                        >
                                            <Flex justify="space-between" align="flex-start">
                                                <Radio value={addr.id}>
                                                    <Text strong>{addr.recipientName}</Text>
                                                    <span
                                                        style={{
                                                            display: "inline-block",
                                                            width: "1px",
                                                            height: "12px",
                                                            backgroundColor: "#d9d9d9",
                                                            margin: "0 8px",
                                                            verticalAlign: "middle",
                                                        }}
                                                    />

                                                    <Text type="secondary">{addr.phoneNumber}</Text>
                                                    <div style={{ marginTop: 8, color: "#595959" }}>
                                                        {addr.fullAddress}
                                                    </div>
                                                </Radio>

                                                <Popconfirm
                                                    title="Xóa địa chỉ này?"
                                                    description="Hành động này không thể hoàn tác."
                                                    onConfirm={() => handleDeleteAddress(addr.id)}
                                                    onCancel={(e) => e.stopPropagation()}
                                                    okText="Xóa"
                                                    cancelText="Quay lại"
                                                >
                                                    <Button
                                                        type="text"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </Popconfirm>
                                            </Flex>
                                        </Card>
                                    ))}
                                </Flex>
                            </Radio.Group>
                        )}
                        <Button
                            type="dashed"
                            block
                            size="large"
                            icon={<PlusOutlined />}
                            onClick={() => setIsAddingAddress(true)}
                            style={{ marginTop: 24 }}
                        >
                            Thêm Địa Chỉ Mới
                        </Button>
                        <Button
                            type="primary"
                            block
                            size="large"
                            onClick={() => setIsAddressModalVisible(false)}
                            style={{ marginTop: 12 }}
                            disabled={!selectedAddress && addresses.length > 0}
                        >
                            Xác nhận
                        </Button>
                    </div>
                )}
            </Modal>

            <Modal
                title="Thanh toán qua mã QR"
                open={isQrModalVisible}
                footer={null}
                closable={false}
                mask={{ closable: false }}
                centered
            >
                <div style={{ textAlign: "center" }}>
                    <Text>
                        Vui lòng quét mã QR để thanh toán đơn hàng <Text strong>#{orderCode}</Text>
                    </Text>
                    <div style={{ margin: "24px 0" }}>
                        <Image
                            src={`https://img.vietqr.io/image/MB-030122102003-compact2.png?amount=${finalAmount}&addInfo=DPWOOD${orderCode}&accountName=DPWOOD_STORE`}
                            alt="Mã QR Thanh toán"
                            width="100%"
                            style={{
                                maxWidth: 280,
                                border: "1px solid #d9d9d9",
                                borderRadius: 12,
                                padding: 12,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                            }}
                            preview={false}
                        />
                    </div>
                    <div
                        style={{
                            background: "#fafafa",
                            padding: 16,
                            borderRadius: 12,
                            textAlign: "left",
                            marginBottom: 24,
                            border: "1px solid #f0f0f0",
                        }}
                    >
                        <p style={{ margin: "4px 0", color: "#595959" }}>
                            Ngân hàng: <Text strong>MB Bank</Text>
                        </p>
                        <p style={{ margin: "4px 0", color: "#595959" }}>
                            Số tài khoản: <Text strong>030122102003</Text>
                        </p>
                        <p style={{ margin: "4px 0", color: "#595959" }}>
                            Số tiền:{" "}
                            <Text
                                strong
                                style={{
                                    color: "#1677ff",
                                    fontSize: "16px",
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {new Intl.NumberFormat("vi-VN").format(finalAmount)} VNĐ
                            </Text>
                        </p>
                        <p style={{ margin: "4px 0", color: "#595959" }}>
                            Nội dung: <Text code>DPWOOD{orderCode}</Text>
                        </p>
                    </div>

                    <Flex vertical gap="middle" style={{ width: "100%" }}>
                        <Button
                            type="primary"
                            block
                            size="large"
                            icon={<ReloadOutlined />}
                            loading={checkingPayment}
                            onClick={handleCheckPayment}
                        >
                            Đã chuyển khoản - Kiểm tra ngay
                        </Button>
                        <Button type="text" block size="large" onClick={handleCancelPayment} danger>
                            Hủy thanh toán & Đóng
                        </Button>
                    </Flex>
                </div>
            </Modal>
        </div>
    );
}
