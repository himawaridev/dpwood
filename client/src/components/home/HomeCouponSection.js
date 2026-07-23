"use client";

import { Button, Popconfirm, Tooltip, Typography } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined, DeleteOutlined, GiftOutlined } from "@ant-design/icons";
import HomeViewAllLink from "@/components/home/HomeViewAllLink";
import {
    formatCompactCurrency,
    getCouponClaimKeys,
    getCouponValue,
    getDaysLeft,
} from "@/utils/homepageData";

const { Paragraph, Text, Title } = Typography;

function HomeCouponCard({
    coupon,
    claimedCouponIds,
    walletItem,
    claimingCouponId,
    deletingCouponId,
    onClaim,
    onDelete,
}) {
    const isClaimed = getCouponClaimKeys(coupon).some((key) => claimedCouponIds.has(key));

    return (
        <article className={`webcake-coupon-card ${isClaimed ? "webcake-coupon-card-claimed" : ""}`}>
            <div className="webcake-coupon-value">
                <GiftOutlined />
                <strong>{getCouponValue(coupon)}</strong>
                <span>GIẢM</span>
            </div>
            <div className="webcake-coupon-content">
                <Text className="webcake-coupon-code">{coupon.code}</Text>
                <Paragraph>
                    {coupon.description || `Đơn hàng từ ${new Intl.NumberFormat("vi-VN").format(coupon.minOrderAmount || 0)}đ`}
                </Paragraph>
                <div className="webcake-coupon-meta">
                    <span><ClockCircleOutlined /> Còn {getDaysLeft(coupon.expiryDate)} ngày</span>
                    {coupon.maxDiscountAmount && (
                        <span><CheckCircleOutlined /> Tối đa {formatCompactCurrency(coupon.maxDiscountAmount)}đ</span>
                    )}
                </div>
                <div className="dp-coupon-wallet-actions">
                    <Button
                        type={isClaimed ? "default" : "primary"}
                        icon={isClaimed ? <CheckCircleOutlined /> : null}
                        disabled={isClaimed}
                        loading={claimingCouponId === coupon.id}
                        onClick={() => onClaim(coupon)}
                    >
                        {isClaimed ? "Đã lấy mã" : "Lưu mã"}
                    </Button>
                    {walletItem && (
                        <Popconfirm
                            title={`Xóa mã ${coupon.code}?`}
                            description="Mã sẽ được xóa khỏi kho ưu đãi của bạn."
                            okText="Xóa"
                            cancelText="Giữ lại"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => onDelete(coupon, walletItem)}
                        >
                            <Tooltip title="Xóa mã khỏi kho">
                                <Button
                                    type="text"
                                    danger
                                    aria-label={`Xóa mã ${coupon.code} khỏi kho`}
                                    icon={<DeleteOutlined />}
                                    loading={deletingCouponId === walletItem.id}
                                    className="dp-coupon-delete-button"
                                />
                            </Tooltip>
                        </Popconfirm>
                    )}
                </div>
            </div>
        </article>
    );
}

export default function HomeCouponSection(props) {
    const { coupons, walletItems } = props;
    if (!coupons.length) return null;

    return (
        <section className="webcake-coupon-section" id="special-offers">
            <div className="webcake-container">
                <Title level={2} className="webcake-section-title">Mã giảm giá</Title>
                <div className="webcake-coupon-mobile-list">
                    {coupons.map((coupon) => {
                        const walletItem = walletItems.find(
                            (item) => String(item.couponId || item.Coupon?.id) === String(coupon.id),
                        );
                        return (
                            <div key={coupon.id || coupon.code} className="webcake-coupon-mobile-item">
                                <HomeCouponCard {...props} coupon={coupon} walletItem={walletItem} />
                            </div>
                        );
                    })}
                </div>
                {coupons.length > 1 && (
                    <HomeViewAllLink href="/gift-codes" label="XEM TẤT CẢ MÃ" icon={<GiftOutlined />} />
                )}
            </div>
        </section>
    );
}
