import axios from "axios";

// 🔴 Tối ưu: Hàm tiện ích xử lý LocalStorage an toàn cho Next.js (SSR)
const storage = {
    get: (key) => (typeof window !== "undefined" ? localStorage.getItem(key) : null),
    set: (key, value) => {
        if (typeof window !== "undefined") localStorage.setItem(key, value);
    },
    remove: (key) => {
        if (typeof window !== "undefined") localStorage.removeItem(key);
    },
    clear: () => {
        if (typeof window !== "undefined") localStorage.clear();
    },
    redirect: (path) => {
        if (typeof window !== "undefined") window.location.href = path;
    },
};

const api = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = storage.get("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Xử lý tài khoản bị khóa
        if (error.response?.status === 403 && error.response?.data?.message === "ACCOUNT_BANNED") {
            storage.clear();
            storage.redirect("/banned");
            return Promise.reject(error);
        }

        // Xử lý hết hạn Access Token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = storage.get("refreshToken");
                if (!refreshToken) throw new Error("Không có refresh token");

                const res = await axios.post("http://localhost:5000/api/auth/refresh", {
                    refreshToken,
                });
                const newToken = res.data.token;

                storage.set("token", newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                return api(originalRequest);
            } catch (refreshError) {
                storage.remove("token");
                storage.remove("refreshToken");
                storage.remove("userName");
                storage.remove("userRole");
                storage.redirect("/login");

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

export default api;
