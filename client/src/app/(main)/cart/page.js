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
    const [discountData, setDiscountData] = useState({ amount: 0 });
    const [isQrModalVisible, setIsQrModalVisible] = useState(false);
    const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
    const [isAuth, setIsAuth] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
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
            message.error("Kh\u00f4ng th\u1ec3 t\u1ea3i \u0111\u1ecba ch\u1ec9 giao h\u00e0ng.");
        }
    }, [message]);

    const fetchCurrentUser = useCallback(async () => {
        try {
            const res = await api.get("/users/me");
            setCurrentUser(res.data);
            if (res.data?.phone) localStorage.setItem("userPhone", res.data.phone);
        } catch {
            setCurrentUser(null);
        }
    }, []);

    useEffect(() => {
        const storedCart = (JSON.parse(localStorage.getItem("cart")) || []).map((item) => ({
            ...item,
            cartItemId: item.cartItemId || item.productId,
        }));
        setCartItems(storedCart);

        const token = localStorage.getItem("token");
        if (token) {
            setIsAuth(true);
            fetchCurrentUser();
            fetchAddresses();
        }
    }, [fetchAddresses, fetchCurrentUser]);

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
            message.success("\u0110\u00e3 th\u00eam \u0111\u1ecba ch\u1ec9 m\u1edbi.");
            setIsAddingAddress(false);
            addressForm.resetFields();
            fetchAddresses();
        } catch {
            message.error("L\u1ed7i khi th\u00eam \u0111\u1ecba ch\u1ec9.");
        }
    };

    const handleDeleteAddress = async (id) => {
        try {
            await api.delete(`/addresses/${id}`);
            message.success("\u0110\u00e3 x\u00f3a \u0111\u1ecba ch\u1ec9.");
            if (selectedAddress?.id === id) setSelectedAddress(null);
            fetchAddresses();
        } catch {
            message.error("Kh\u00f4ng th\u1ec3 x\u00f3a \u0111\u1ecba ch\u1ec9 l\u00fac n\u00e0y.");
        }
    };

    const saveCart = (newCart) => {
        setCartItems(newCart);
        localStorage.setItem("cart", JSON.stringify(newCart));
        window.dispatchEvent(new Event("cart-updated"));
    };

    const handleQuantityChange = (cartItemId, value) => {
        const safeValue = Math.max(1, Number(value || 1));
        saveCart(
            cartItems.map((item) =>
                (item.cartItemId || item.productId) === cartItemId ? { ...item, quantity: safeValue } : item,
            ),
        );
    };

    const handleRemoveItem = (cartItemId) => {
        saveCart(cartItems.filter((item) => (item.cartItemId || item.productId) !== cartItemId));
        message.success("\u0110\u00e3 x\u00f3a s\u1ea3n ph\u1ea9m kh\u1ecfi gi\u1ecf.");
    };

    const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const finalPrice = Math.max(0, totalPrice - (discountData?.amount || 0));

    const handleCheckoutClick = () => {
        if (!isAuth) {
            message.warning("Vui l\u00f2ng \u0111\u0103ng nh\u1eadp \u0111\u1ec3 thanh to\u00e1n.");
            router.push("/login");
            return;
        }
        if (!currentUser?.phone) {
            message.warning("Vui l\u00f2ng c\u1eadp nh\u1eadt s\u1ed1 \u0111i\u1ec7n tho\u1ea1i trong h\u1ed3 s\u01a1 tr\u01b0\u1edbc khi thanh to\u00e1n.");
            router.push("/profile");
            return;
        }
        if (!selectedAddress) {
            message.error("Vui l\u00f2ng ch\u1ecdn ho\u1eb7c th\u00eam \u0111\u1ecba ch\u1ec9 giao h\u00e0ng.");
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
                    variantId: item.variantId || null,
                    variantLabel: item.variantLabel || null,
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
            message.error(error.response?.data?.message || "L\u1ed7i khi t\u1ea1o \u0111\u01a1n h\u00e0ng.");
            setIsConfirmModalVisible(false);
        } finally {
            setLoading(false);
        }
    };

    const completePaidOrder = useCallback(
        (paidOrderCode = orderCode) => {
            message.success("Thanh to\u00e1n th\u00e0nh c\u00f4ng. \u0110ang chuy\u1ec3n \u0111\u1ebfn \u0111\u01a1n h\u00e0ng c\u1ee7a b\u1ea1n.");
            setIsQrModalVisible(false);
            localStorage.removeItem("cart");
            window.dispatchEvent(new Event("cart-updated"));
            setCartItems([]);
            router.push(`/profile?status=PAID&orderCode=${paidOrderCode}`);
        },
        [message, orderCode, router],
    );

    const refreshPaymentStatus = useCallback(
        async (targetOrderCode = orderCode, { silent = true } = {}) => {
            if (!targetOrderCode) return false;

            try {
                const response = await api.get(`/orders/${targetOrderCode}/status`);
                if (response.data.status === "PAID" || response.data.paymentStatus === "PAID") {
                    completePaidOrder(targetOrderCode);
                    return true;
                }
                return false;
            } catch {
                if (!silent) message.error("Kh\u00f4ng th\u1ec3 ki\u1ec3m tra tr\u1ea1ng th\u00e1i thanh to\u00e1n.");
                return false;
            }
        },
        [completePaidOrder, message, orderCode],
    );

    useEffect(() => {
        if (!isQrModalVisible || !orderCode) return undefined;

        let stopped = false;
        let polling = false;
        setCheckingPayment(true);

        const pollPayment = async () => {
            if (stopped || polling) return;
            polling = true;
            try {
                const paid = await refreshPaymentStatus(orderCode);
                if (paid) stopped = true;
            } finally {
                polling = false;
            }
        };

        pollPayment();
        const intervalId = window.setInterval(pollPayment, 1000);

        return () => {
            stopped = true;
            window.clearInterval(intervalId);
            setCheckingPayment(false);
        };
    }, [isQrModalVisible, orderCode, refreshPaymentStatus]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const returnedOrderCode = params.get("orderCode");
        if (params.get("success") !== "true" || !returnedOrderCode) return undefined;

        setOrderCode(returnedOrderCode);
        setCheckingPayment(true);
        let attempts = 0;
        let intervalId;

        const verifyReturnedPayment = async () => {
            attempts += 1;
            const paid = await refreshPaymentStatus(returnedOrderCode, { silent: attempts < 20 });
            if (paid || attempts >= 20) {
                window.clearInterval(intervalId);
                setCheckingPayment(false);
                if (!paid) {
                    message.warning("H\u1ec7 th\u1ed1ng ch\u01b0a nh\u1eadn \u0111\u01b0\u1ee3c ti\u1ec1n. Vui l\u00f2ng m\u1edf l\u1ea1i \u0111\u01a1n h\u00e0ng sau v\u00e0i gi\u00e2y.");
                    router.replace("/profile");
                }
            }
        };

        intervalId = window.setInterval(verifyReturnedPayment, 1000);
        verifyReturnedPayment();

        return () => window.clearInterval(intervalId);
    }, [message, refreshPaymentStatus, router]);

    const handleCancelPayment = async () => {
        try {
            await api.put(`/orders/${orderCode}/cancel`);
            setIsQrModalVisible(false);
            message.info("\u0110\u00e3 h\u1ee7y thanh to\u00e1n. Gi\u1ecf h\u00e0ng c\u1ee7a b\u1ea1n \u0111\u01b0\u1ee3c gi\u1eef nguy\u00ean.");
        } catch {
            message.error("L\u1ed7i khi h\u1ee7y giao d\u1ecbch.");
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
                        {"Gi\u1ecf h\u00e0ng"}
                    </Title>
                    <Text className="dp-muted">
                        {"Ki\u1ec3m tra s\u1ea3n ph\u1ea9m, \u0111\u1ecba ch\u1ec9 v\u00e0 ph\u01b0\u01a1ng th\u1ee9c thanh to\u00e1n tr\u01b0\u1edbc khi ch\u1ed1t \u0111\u01a1n."}
                    </Text>
                </section>

                {cartItems.length > 0 && (
                    <Steps
                        size="small"
                        current={selectedAddress ? 1 : 0}
                        style={{ marginBottom: 22 }}
                        items={[
                            { title: "\u0110\u1ecba ch\u1ec9" },
                            { title: "Gi\u1ecf h\u00e0ng" },
                            { title: "X\u00e1c nh\u1eadn" },
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
                        currentUser={currentUser}
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
                handleCancelPayment={handleCancelPayment}
            />
        </div>
    );
}
