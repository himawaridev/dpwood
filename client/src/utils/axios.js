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

const AUTH_KEYS = ["token", "refreshToken", "userName", "userRole", "avatarUrl"];
const AUTH_ENDPOINT_PATTERN = /\/auth\/(login|register|google|refresh|forgot-password|resend-verification)/;
let refreshPromise = null;
let redirectingToLogin = false;

const clearAuthSession = () => {
    AUTH_KEYS.forEach((key) => storage.remove(key));
    if (typeof window !== "undefined") window.dispatchEvent(new Event("auth-session-changed"));
};

const redirectToLogin = () => {
    if (typeof window === "undefined" || redirectingToLogin || window.location.pathname === "/login") return;
    redirectingToLogin = true;
    storage.redirect("/login");
};

const getTokenExpiry = (token) => {
    try {
        const payload = token.split(".")[1];
        if (!payload) return null;
        const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
        const decoded = JSON.parse(window.atob(padded));
        return Number(decoded.exp || 0) * 1000 || null;
    } catch {
        return null;
    }
};

const tokenNeedsRefresh = (token) => {
    if (typeof window === "undefined") return false;
    const expiresAt = getTokenExpiry(token);
    return expiresAt !== null && expiresAt <= Date.now() + 30_000;
};

const refreshAccessToken = async () => {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        const refreshToken = storage.get("refreshToken");
        if (!refreshToken) throw new Error("Không có refresh token");
        const response = await axios.post(`${getBaseURL()}/auth/refresh`, { refreshToken });
        const newToken = response.data?.token;
        if (!newToken) throw new Error("Máy chủ không trả về access token mới");
        storage.set("token", newToken);
        return newToken;
    })();

    try {
        return await refreshPromise;
    } finally {
        refreshPromise = null;
    }
};

const expireSession = () => {
    clearAuthSession();
    redirectToLogin();
};

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    async (config) => {
        let token = storage.get("token");
        const isAuthEndpoint = AUTH_ENDPOINT_PATTERN.test(String(config.url || ""));

        if (config.authRequired && !isAuthEndpoint && (!token || tokenNeedsRefresh(token))) {
            try {
                token = await refreshAccessToken();
            } catch (refreshError) {
                expireSession();
                return Promise.reject(new axios.CanceledError(refreshError.message || "Phiên đăng nhập đã hết hạn"));
            }
        }

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

        const isAuthEndpoint = AUTH_ENDPOINT_PATTERN.test(String(originalRequest?.url || ""));
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            try {
                const newToken = await refreshAccessToken();
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                expireSession();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

export default api;
