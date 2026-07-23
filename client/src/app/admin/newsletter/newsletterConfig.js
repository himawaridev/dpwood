export const NEWSLETTER_STATUS_META = {
    pending: { label: "Chờ xác nhận", color: "gold" },
    subscribed: { label: "Đã đăng ký", color: "green" },
    unsubscribed: { label: "Đã hủy", color: "default" },
};

export const USER_ROLE_META = {
    root: { label: "Root", color: "red" },
    admin: { label: "Quản trị", color: "volcano" },
    staff: { label: "Nhân viên", color: "blue" },
    user: { label: "Khách hàng", color: "default" },
};

export const CAMPAIGN_STATUS_META = {
    queued: { label: "Đang chờ", color: "gold" },
    processing: { label: "Đang gửi", color: "blue" },
    completed: { label: "Hoàn tất", color: "green" },
    failed: { label: "Thất bại", color: "red" },
    cancelled: { label: "Đã hủy", color: "default" },
};
