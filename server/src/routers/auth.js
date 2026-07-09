const express = require("express");
const router = express.Router();

const {
    register,
    resendVerification,
    login,
    refresh,
    forgotPassword,
    resetPassword,
    verifyEmail,
    logout,
    googleLogin,
} = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const { authLimiter, passwordLimiter } = require("../middlewares/securityMiddleware");

// ==========================================
// [PUBLIC] ROUTES - Không yêu cầu đăng nhập
// ==========================================
router.post("/register", authLimiter, register);
router.post("/resend-verification", passwordLimiter, resendVerification);
router.post("/login", authLimiter, login);
router.post("/google", authLimiter, googleLogin);
router.post("/refresh", refresh);
router.post("/forgot", passwordLimiter, forgotPassword);
router.post("/reset", passwordLimiter, resetPassword);
router.get("/verify/:token", verifyEmail);

// ==========================================
// [CLIENT] ROUTES - Yêu cầu đăng nhập
// ==========================================
router.post("/logout", authMiddleware, logout);

module.exports = router;
