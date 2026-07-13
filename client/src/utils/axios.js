import axios from "axios";

const getBaseURL = () => {
    if (typeof window !== "undefined") {
        const localHosts = ["localhost", "127.0.0.1", "::1"];
        if (!localHosts.includes(window.location.hostname)) {
            return "/api";
        }
    }
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    return "http://localhost:5000/api";
};

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
    baseURL: getBaseURL(),
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

        const method = String(originalRequest?.method || "").toLowerCase();
        const status = error.response?.status;
        const isTransientReadFailure =
            method === "get" && (!error.response || [502, 503, 504].includes(status));
        const retryCount = Number(originalRequest?._transientRetryCount || 0);

        if (originalRequest && isTransientReadFailure && retryCount < 2) {
            originalRequest._transientRetryCount = retryCount + 1;
            await new Promise((resolve) => setTimeout(resolve, 700 * (retryCount + 1)));
            return api(originalRequest);
        }

        if (error.response?.status === 403 && error.response?.data?.message === "ACCOUNT_BANNED") {
            storage.clear();
            storage.redirect("/banned");
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = storage.get("refreshToken");
                if (!refreshToken) throw new Error("Không có refresh token");

                const res = await axios.post(`${getBaseURL()}/auth/refresh`, { refreshToken });
                const newToken = res.data.token;

                storage.set("token", newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                return api(originalRequest);
            } catch (refreshError) {
                storage.remove("token");
                storage.remove("refreshToken");
                storage.remove("userName");
                storage.remove("userRole");
                storage.remove("avatarUrl");
                storage.redirect("/login");

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

export default api;
