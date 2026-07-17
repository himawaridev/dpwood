const ACTIVITY_ACTIONS = {
    LOGIN: { label: "Đăng nhập", color: "green" },
    LOGOUT: { label: "Đăng xuất", color: "volcano" },
    REGISTER: { label: "Đăng ký", color: "gold" },
    BAN: { label: "Khóa tài khoản", color: "red" },
    UNBAN: { label: "Mở khóa", color: "success" },
    ROLE_CHANGE: { label: "Phân quyền", color: "purple" },
    ORDER_CREATED: { label: "Tạo đơn hàng", color: "blue", note: "Khách hàng tạo đơn mới" },
    PAYMENT_RECEIVED: { label: "Thanh toán", color: "cyan", note: "Hệ thống xác nhận nhận tiền tự động" },
    ORDER_CANCELED: { label: "Hủy đơn", color: "magenta", note: "Hủy đơn hàng và hoàn lại tồn kho" },
    ADMIN_UPDATE_ORDER: { label: "QTV cập nhật", color: "purple", note: "Quản trị viên cập nhật trạng thái đơn" },
    SYSTEM: { label: "Hệ thống", color: "purple", note: "Cập nhật hệ thống" },
};

export const getActivityActionMeta = (action) => {
    const normalizedAction = String(action || "").toUpperCase();
    return {
        label: normalizedAction || "Không xác định",
        color: "default",
        note: "Cập nhật hệ thống",
        ...ACTIVITY_ACTIONS[normalizedAction],
    };
};
