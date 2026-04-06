import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000/api", // Đổi port nếu backend của bạn chạy port khác
    headers: {
        "Content-Type": "application/json",
    },
});

// 1. Gắn Access Token vào Header trước khi gửi request (Giữ nguyên như cũ)
api.interceptors.request.use(
    (config) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// 2. Bắt lỗi trả về từ Backend (CẬP NHẬT MỚI)
api.interceptors.response.use(
    (response) => {
        // Nếu request thành công, cứ thế trả về
        return response;
    },
    async (error) => {
        // Lưu lại thông tin cái request vừa bị lỗi
        const originalRequest = error.config;

        if (
            error.response &&
            error.response.status === 403 &&
            error.response.data.message === "ACCOUNT_BANNED"
        ) {
            if (typeof window !== "undefined") {
                // Xóa sạch dữ liệu
                localStorage.clear();
                // Đẩy sang trang báo bị khóa ngay lập tức
                window.location.href = "/banned";
            }
            return Promise.reject(error);
        }

        // Nếu lỗi là 401 (Hết hạn Access Token) VÀ chưa từng thử refresh token lần nào (_retry)
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            // Đánh dấu là đã thử refresh để tránh kẹt trong vòng lặp vô hạn
            originalRequest._retry = true;

            try {
                // Lấy Refresh Token từ LocalStorage
                const refreshToken =
                    typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;

                if (!refreshToken) {
                    throw new Error("Không có refresh token");
                }

                // Gọi API của Backend để xin Access Token mới (Lưu ý: Dùng thư viện axios gốc, không dùng biến 'api' ở đây để tránh lặp)
                const res = await axios.post("http://localhost:5000/api/auth/refresh", {
                    refreshToken: refreshToken,
                });

                // Thành công! Có chìa khóa mới.
                const newToken = res.data.token;

                // Cất chìa khóa mới vào LocalStorage
                localStorage.setItem("token", newToken);

                // Gắn chìa khóa mới vào cái request ban nãy bị lỗi
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                // Tự động gọi lại request đó như chưa hề có cuộc chia ly
                return api(originalRequest);
            } catch (refreshError) {
                // Nếu chui vào đây nghĩa là Refresh Token cũng đã hết hạn (quá 7 ngày) hoặc bị giả mạo.
                // Bắt buộc phải "đá" người dùng ra trang Đăng nhập.
                if (typeof window !== "undefined") {
                    localStorage.removeItem("token");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("userName");
                    localStorage.removeItem("userRole");
                    // Dùng window.location để ép tải lại trang và xóa sạch cache state
                    window.location.href = "/login";
                }
                return Promise.reject(refreshError);
            }
        }

        // Trả về các lỗi khác (ví dụ 400, 403, 500...) như bình thường
        return Promise.reject(error);
    },
);

export default api;
