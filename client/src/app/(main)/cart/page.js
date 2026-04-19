"use client";
import { useEffect, useState } from "react";
import { Typography, message, Form } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";

// Import các Component đã chia nhỏ
import SuccessResult from "./components/SuccessResult";
import AddressSection from "./components/AddressSection";
import CartTable from "./components/CartTable";
import ConfirmOrderModal from "./components/ConfirmOrderModal";
import PaymentQRModal from "./components/PaymentQRModal";

const { Title } = Typography;

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
    const [checkingPayment, setCheckingPayment] = useState(false);

    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [addressForm] = Form.useForm();

    // Coupon states
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [myCoupons, setMyCoupons] = useState([]);

    const router = useRouter();

    const fetchMyCoupons = async () => {
        try {
            const res = await api.get("/coupons/my");
            setMyCoupons(res.data);
        } catch (error) {
            console.error("Lỗi tải mã giảm giá:", error);
        }
    };

    useEffect(() => {
        const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
        setCartItems(storedCart);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (token) {
            setIsAuth(true);
            setUserEmail(localStorage.getItem("userEmail") || "Email của bạn");
            fetchAddresses();
            fetchMyCoupons();
        }
    }, []);

    const fetchAddresses = async () => {
        try {
            const res = await api.get("/addresses");
            setAddresses(res.data);
            if (res.data.length > 0) setSelectedAddress(res.data[0]);
        } catch (error) {}
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
            if (selectedAddress?.id === id) setSelectedAddress(null);
            fetchAddresses();
        } catch (error) {
            message.error("Không thể xóa địa chỉ lúc này.");
        }
    };

    const saveCart = (newCart) => {
        setCartItems(newCart);
        localStorage.setItem("cart", JSON.stringify(newCart));
        // Reset coupon khi thay đổi giỏ hàng vì tổng tiền thay đổi
        if (appliedCoupon) {
            setAppliedCoupon(null);
            setCouponCode("");
            message.info("Giỏ hàng đã thay đổi, vui lòng áp dụng lại mã giảm giá.");
        }
    };

    const handleQuantityChange = (value, productId) => {
        saveCart(
            cartItems.map((item) =>
                item.productId === productId ? { ...item, quantity: value } : item,
            ),
        );
    };

    const handleRemoveItem = (productId) => {
        saveCart(cartItems.filter((item) => item.productId !== productId));
        message.success("Đã xóa sản phẩm khỏi giỏ");
    };

    const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

    // ===== COUPON LOGIC =====
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            message.warning("Vui lòng nhập mã giảm giá");
            return;
        }
        if (!isAuth) {
            message.warning("Vui lòng đăng nhập để sử dụng mã giảm giá!");
            return;
        }

        try {
            setCouponLoading(true);
            const res = await api.post("/coupons/apply", {
                code: couponCode.trim(),
                totalAmount: totalPrice,
            });
            setAppliedCoupon(res.data);
            message.success(res.data.message || "Áp dụng mã giảm giá thành công!");
        } catch (error) {
            message.error(error.response?.data?.message || "Mã giảm giá không hợp lệ");
            setAppliedCoupon(null);
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode("");
        message.info("Đã hủy mã giảm giá");
    };

    const discountAmount = appliedCoupon?.discountAmount || 0;
    const finalPrice = totalPrice - discountAmount;

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
                couponCode: appliedCoupon?.couponCode || null,
            };

            const response = await api.post("/orders/checkout", payload);

            setIsConfirmModalVisible(false);
            setOrderCode(response.data.orderCode);

            if (paymentMethod === "QR") {
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
                message.warning("Hệ thống chưa nhận được tiền. Vui lòng chờ vài giây!");
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

    if (isSuccess) return <SuccessResult orderCode={orderCode} />;

    return (
        <div style={{ padding: "40px 20px", background: "#f0f2f5", minHeight: "100vh" }}>
            <div style={{ maxWidth: 1000, margin: "0 auto", width: "100%" }}>
                <Title level={2} style={{ color: "#001529", marginBottom: 24 }}>
                    <ShoppingCartOutlined style={{ color: "#1677ff", marginRight: 12 }} />
                    Giỏ hàng của bạn
                </Title>

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
                    couponCode={couponCode}
                    setCouponCode={setCouponCode}
                    appliedCoupon={appliedCoupon}
                    couponLoading={couponLoading}
                    handleApplyCoupon={handleApplyCoupon}
                    handleRemoveCoupon={handleRemoveCoupon}
                    discountAmount={discountAmount}
                    finalPrice={finalPrice}
                    myCoupons={myCoupons}
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
                totalPrice={totalPrice}
                appliedCoupon={appliedCoupon}
                discountAmount={discountAmount}
                finalPrice={finalPrice}
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
