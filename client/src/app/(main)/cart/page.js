"use client";

import { useCallback, useEffect, useState } from "react";
import { App, Typography, Form, Steps } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import SuccessResult from "./components/SuccessResult";
import AddressSection from "./components/AddressSection";
import CartTable from "./components/CartTable";
import ConfirmOrderModal from "./components/ConfirmOrderModal";
import PaymentQRModal from "./components/PaymentQRModal";

const { Title, Text } = Typography;

const normalizePhoneNumber = (countryCode = "+84", rawPhone = "") => {
    const digits = String(rawPhone).replace(/\D/g, "");

    if (countryCode === "+84") {
        let nationalNumber = digits;
        if (nationalNumber.startsWith("84")) nationalNumber = nationalNumber.slice(2);
        if (nationalNumber.startsWith("0")) nationalNumber = nationalNumber.slice(1);
        return `${countryCode}${nationalNumber}`;
    }

    return `${countryCode}${digits}`;
};

export default function CartPage() {
    const { message } = App.useApp();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("COD");
    const [payosData, setPayosData] = useState(null);
    const [discountCode, setDiscountCode] = useState("");
    const [discountData, setDiscountData] = useState({ percentage: 0, amount: 0 });
    const [isQrModalVisible, setIsQrModalVisible] = useState(false);
    const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
    const [isAuth, setIsAuth] = useState(false);
    const [orderCode, setOrderCode] = useState("");
    const [checkingPayment, setCheckingPayment] = useState(false);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [addressForm] = Form.useForm();
    const router = useRouter();

    const fetchAddresses = useCallback(async () => {
        try {
            const res = await api.get("/addresses");
            setAddresses(res.data);
            if (res.data.length > 0) setSelectedAddress(res.data[0]);
        } catch {
            message.error("Không thể tải địa chỉ giao hàng.");
        }
    }, [message]);

    useEffect(() => {
        const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
        setCartItems(storedCart);

        const token = localStorage.getItem("token");
        if (token) {
            setIsAuth(true);
            fetchAddresses();
        }
    }, [fetchAddresses]);

    const handleSaveNewAddress = async (values) => {
        try {
            const fullAddress = [
                values.streetAddress,
                values.wardName,
                values.districtName,
                values.provinceName,
            ]
                .filter(Boolean)
                .join(", ");

            await api.post("/addresses", {
                recipientName: values.recipientName,
                phoneNumber: normalizePhoneNumber(values.phoneCountryCode, values.phoneLocalNumber),
                fullAddress,
                isDefault: true,
            });
            message.success("Đã thêm địa chỉ mới.");
            setIsAddingAddress(false);
            addressForm.resetFields();
            fetchAddresses();
        } catch {
            message.error("Lỗi khi thêm địa chỉ");
        }
    };

    const handleDeleteAddress = async (id) => {
        try {
            await api.delete(`/addresses/${id}`);
            message.success("Đã xóa địa chỉ.");
            if (selectedAddress?.id === id) setSelectedAddress(null);
            fetchAddresses();
        } catch {
            message.error("Không thể xóa địa chỉ lúc này.");
        }
    };

    const saveCart = (newCart) => {
        setCartItems(newCart);
        localStorage.setItem("cart", JSON.stringify(newCart));
        window.dispatchEvent(new Event("cart-updated"));
    };

    const handleQuantityChange = (productId, value) => {
        const safeValue = Math.max(1, Number(value || 1));
        saveCart(
            cartItems.map((item) =>
                item.productId === productId ? { ...item, quantity: safeValue } : item,
            ),
        );
    };

    const handleRemoveItem = (productId) => {
        saveCart(cartItems.filter((item) => item.productId !== productId));
        message.success("Đã xóa sản phẩm khỏi giỏ");
    };

    const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const finalPrice = Math.max(0, totalPrice - (discountData?.amount || 0));

    const handleCheckoutClick = () => {
        if (!isAuth) {
            message.warning("Vui lòng đăng nhập để thanh toán.");
            router.push("/login");
            return;
        }
        if (!selectedAddress) {
            message.error("Vui lòng chọn hoặc thêm địa chỉ giao hàng.");
            return;
        }
        setIsConfirmModalVisible(true);
    };

    const confirmOrder = async () => {
        try {
            setLoading(true);
            const payload = {
                items: cartItems.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                })),
                paymentMethod,
                shippingInfo: {
                    recipientName: selectedAddress.recipientName,
                    phoneNumber: selectedAddress.phoneNumber,
                    fullAddress: selectedAddress.fullAddress,
                },
                discountCode,
            };

            const response = await api.post("/orders/checkout", payload);

            setIsConfirmModalVisible(false);
            setOrderCode(response.data.orderCode);

            if (paymentMethod === "QR") {
                setPayosData(response.data.payosData || response.data.paymentLink || null);
                setIsQrModalVisible(true);
            } else {
                localStorage.removeItem("cart");
                window.dispatchEvent(new Event("cart-updated"));
                setCartItems([]);
                setIsSuccess(true);
            }
        } catch (error) {
            message.error(error.response?.data?.message || "Lỗi khi tạo đơn hàng");
            setIsConfirmModalVisible(false);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckPayment = async () => {
        try {
            setCheckingPayment(true);
            const response = await api.get(`/orders/${orderCode}/status`);
            if (response.data.status === "PAID") {
                message.success("Thanh toán thành công.");
                setIsQrModalVisible(false);
                localStorage.removeItem("cart");
                window.dispatchEvent(new Event("cart-updated"));
                setCartItems([]);
                setIsSuccess(true);
            } else {
                message.warning("Hệ thống chưa nhận được tiền. Vui lòng chờ thêm vài giây.");
            }
        } catch {
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
        } catch {
            message.error("Lỗi khi hủy giao dịch");
        }
    };

    if (isSuccess) return <SuccessResult orderCode={orderCode} />;

    return (
        <div className="dp-page">
            <div className="dp-container" style={{ maxWidth: 1060 }}>
                <section style={{ marginBottom: 22 }}>
                    <span className="dp-eyebrow">Checkout</span>
                    <Title level={1} className="dp-section-title">
                        <ShoppingCartOutlined style={{ color: "var(--dp-primary)", marginRight: 10 }} />
                        Giỏ hàng
                    </Title>
                    <Text className="dp-muted">
                        Kiểm tra sản phẩm, địa chỉ và phương thức thanh toán trước khi chốt đơn.
                    </Text>
                </section>

                {cartItems.length > 0 && (
                    <Steps
                        size="small"
                        current={selectedAddress ? 1 : 0}
                        style={{ marginBottom: 22 }}
                        items={[
                            { title: "Địa chỉ" },
                            { title: "Giỏ hàng" },
                            { title: "Xác nhận" },
                        ]}
                    />
                )}

                {cartItems.length > 0 && (
                    <AddressSection
                        isAuth={isAuth}
                        addresses={addresses}
                        selectedAddress={selectedAddress}
                        setSelectedAddress={setSelectedAddress}
                        isAddressModalVisible={isAddressModalVisible}
                        setIsAddressModalVisible={setIsAddressModalVisible}
                        isAddingAddress={isAddingAddress}
                        setIsAddingAddress={setIsAddingAddress}
                        addressForm={addressForm}
                        handleSaveNewAddress={handleSaveNewAddress}
                        handleDeleteAddress={handleDeleteAddress}
                    />
                )}

                <CartTable
                    cartItems={cartItems}
                    handleQuantityChange={handleQuantityChange}
                    handleRemoveItem={handleRemoveItem}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    totalPrice={totalPrice}
                    loading={loading}
                    handleCheckoutClick={handleCheckoutClick}
                    discountCode={discountCode}
                    setDiscountCode={setDiscountCode}
                    discountData={discountData}
                    setDiscountData={setDiscountData}
                />
            </div>

            <ConfirmOrderModal
                isConfirmModalVisible={isConfirmModalVisible}
                setIsConfirmModalVisible={setIsConfirmModalVisible}
                confirmOrder={confirmOrder}
                loading={loading}
                selectedAddress={selectedAddress}
                paymentMethod={paymentMethod}
                cartItems={cartItems}
                totalPrice={finalPrice}
            />

            <PaymentQRModal
                isQrModalVisible={isQrModalVisible}
                payosData={payosData}
                checkingPayment={checkingPayment}
                handleCheckPayment={handleCheckPayment}
                handleCancelPayment={handleCancelPayment}
            />
        </div>
    );
}
