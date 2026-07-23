export const persistAuthSession = (data) => {
    localStorage.setItem("token", data.token);
    if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("userName", data.user.name);
    localStorage.setItem("userRole", data.user.role);

    if (data.user.avatarUrl) localStorage.setItem("avatarUrl", data.user.avatarUrl);
    else localStorage.removeItem("avatarUrl");

    window.dispatchEvent(new Event("auth-session-changed"));
};
