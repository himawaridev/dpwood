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
import { trackCommerceEvent } from "@/utils/commerceAnalytics";

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
    const [cancelingPayment, setCancelingPayment] = useState(false);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [shippingFee, setShippingFee] = useState(0);
    const [checkoutRequestId, setCheckoutRequestId] = useState("");
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
            if (storedCart.length) {
                api.put("/commerce/cart", { items: storedCart }).catch(() => {});
            } else {
                api.get("/commerce/cart")
                    .then((response) => {
                        const recoveredItems = Array.isArray(response.data?.items)
                            ? response.data.items.map((item) => ({
                                ...item,
                                cartItemId: item.variantId
                                    ? `${item.productId}:${item.variantId}`
                                    : item.productId,
                            }))
                            : [];
                        if (!recoveredItems.length) return;
                        setCartItems(recoveredItems);
                        localStorage.setItem("cart", JSON.stringify(recoveredItems));
                        window.dispatchEvent(new Event("cart-updated"));
                        message.info("Đã khôi phục giỏ hàng từ tài khoản của bạn.");
                    })
                    .catch(() => {});
            }
        }
    }, [fetchAddresses, fetchCurrentUser, message]);

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
        if (localStorage.getItem("token")) {
            api.put("/commerce/cart", { items: newCart }).catch(() => {});
        }
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

    const handleCheckoutClick = async () => {
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
        try {
            const quoteResponse = await api.post("/commerce/shipping/quote", {
                subtotal: finalPrice,
                address: selectedAddress.fullAddress,
            });
            setShippingFee(Number(quoteResponse.data?.shippingFee || 0));
        } catch {
            setShippingFee(0);
            message.warning("Chưa thể tính phí giao hàng. Hệ thống sẽ xác nhận lại khi đặt đơn.");
        }
        setCheckoutRequestId(
            typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : `checkout-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        );
        trackCommerceEvent("begin_checkout", {
            itemCount: cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
            value: finalPrice,
            currency: "VND",
            paymentMethod,
        });
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

            const response = await api.post("/orders/checkout", payload, {
                headers: { "Idempotency-Key": checkoutRequestId },
            });

            setIsConfirmModalVisible(false);
            setOrderCode(response.data.orderCode);

            if (paymentMethod === "QR") {
                setPayosData(response.data.payosData || response.data.paymentLink || null);
                setIsQrModalVisible(true);
            } else {
                localStorage.removeItem("cart");
                api.delete("/commerce/cart").catch(() => {});
                window.dispatchEvent(new Event("cart-updated"));
                setCartItems([]);
                setIsSuccess(true);
                trackCommerceEvent("purchase", {
                    orderCode: String(response.data.orderCode || ""),
                    value: Number(response.data.totalAmount || finalPrice + shippingFee),
                    shipping: Number(response.data.shippingFee || shippingFee),
                    currency: "VND",
                    paymentMethod: "COD",
                });
            }
            setCheckoutRequestId("");
        } catch (error) {
            message.error(error.response?.data?.message || "L\u1ed7i khi t\u1ea1o \u0111\u01a1n h\u00e0ng.");
            setIsConfirmModalVisible(false);
        } finally {
            setLoading(false);
        }
    };

    const completePaidOrder = useCallback(
        (paidOrderCode = orderCode) => {
            trackCommerceEvent("purchase", {
                orderCode: String(paidOrderCode || ""),
                value: finalPrice + shippingFee,
                shipping: shippingFee,
                currency: "VND",
                paymentMethod: "QR",
            });
            message.success("Thanh to\u00e1n th\u00e0nh c\u00f4ng. \u0110ang chuy\u1ec3n \u0111\u1ebfn \u0111\u01a1n h\u00e0ng c\u1ee7a b\u1ea1n.");
            setIsQrModalVisible(false);
            localStorage.removeItem("cart");
            api.delete("/commerce/cart").catch(() => {});
            window.dispatchEvent(new Event("cart-updated"));
            setCartItems([]);
            router.push(`/orders?status=PAID&orderCode=${paidOrderCode}`);
        },
        [finalPrice, message, orderCode, router, shippingFee],
    );

    const closeCanceledPayment = useCallback(() => {
        setIsQrModalVisible(false);
        setPayosData(null);
        setOrderCode("");
        message.warning("Mã QR đã hết hạn hoặc đơn hàng đã được hủy. Giỏ hàng của bạn được giữ nguyên.");
    }, [message]);

    const refreshPaymentStatus = useCallback(
        async (targetOrderCode = orderCode, { silent = true } = {}) => {
            if (!targetOrderCode) return false;

            try {
                const response = await api.get(`/orders/${targetOrderCode}/status`);
                if (response.data.status === "PAID" || response.data.paymentStatus === "PAID") {
                    completePaidOrder(targetOrderCode);
                    return true;
                }
                if (
                    response.data.status === "CANCELED" ||
                    response.data.paymentStatus === "CANCELED" ||
                    response.data.paymentStatus === "CANCELLED" ||
                    response.data.paymentStatus === "EXPIRED"
                ) {
                    closeCanceledPayment();
                    return true;
                }
                return false;
            } catch {
                if (!silent) message.error("Kh\u00f4ng th\u1ec3 ki\u1ec3m tra tr\u1ea1ng th\u00e1i thanh to\u00e1n.");
                return false;
            }
        },
        [closeCanceledPayment, completePaidOrder, message, orderCode],
    );

    useEffect(() => {
        if (!isQrModalVisible || !orderCode || cancelingPayment) return undefined;

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
        const intervalId = window.setInterval(pollPayment, 2500);

        return () => {
            stopped = true;
            window.clearInterval(intervalId);
            setCheckingPayment(false);
        };
    }, [cancelingPayment, isQrModalVisible, orderCode, refreshPaymentStatus]);

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

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const canceledOrderCode = params.get("orderCode");
        if (params.get("cancel") !== "true" || !canceledOrderCode) return;

        let active = true;
        const cancelReturnedPayment = async () => {
            try {
                setCancelingPayment(true);
                const response = await api.put(`/orders/${canceledOrderCode}/cancel`);
                if (active) message.info(response.data?.message || "Đã hủy thanh toán. Giỏ hàng của bạn được giữ nguyên.");
            } catch (error) {
                if (active) message.error(error.response?.data?.message || "Không thể hủy giao dịch lúc này.");
            } finally {
                if (active) {
                    setCancelingPayment(false);
                    router.replace("/cart");
                }
            }
        };

        cancelReturnedPayment();
        return () => {
            active = false;
        };
    }, [message, router]);

    const handleCancelPayment = async () => {
        if (!orderCode || cancelingPayment) return;
        try {
            setCancelingPayment(true);
            const response = await api.put(`/orders/${orderCode}/cancel`);
            setIsQrModalVisible(false);
            setPayosData(null);
            setOrderCode("");
            message.info(response.data?.message || "Đã hủy thanh toán. Giỏ hàng của bạn được giữ nguyên.");
        } catch (error) {
            message.error(error.response?.data?.message || "Không thể hủy giao dịch lúc này.");
        } finally {
            setCancelingPayment(false);
        }
    };

    if (isSuccess) return <SuccessResult orderCode={orderCode} />;

    return (
        <div className="dp-page">
            <div className="dp-container" style={{ maxWidth: 1060 }}>
                <section style={{ marginBottom: 22 }}>
                    <span className="dp-eyebrow">Thanh toán</span>
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
                subTotal={finalPrice}
                shippingFee={shippingFee}
                totalPrice={finalPrice + shippingFee}
            />

            <PaymentQRModal
                isQrModalVisible={isQrModalVisible}
                payosData={payosData}
                checkingPayment={checkingPayment}
                cancelingPayment={cancelingPayment}
                handleCancelPayment={handleCancelPayment}
            />
        </div>
    );
}
