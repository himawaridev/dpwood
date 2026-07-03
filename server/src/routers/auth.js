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

// ==========================================
// [PUBLIC] ROUTES - Không yêu cầu đăng nhập
// ==========================================
router.post("/register", register);
router.post("/resend-verification", resendVerification);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/refresh", refresh);
router.post("/forgot", forgotPassword);
router.post("/reset", resetPassword);
router.get("/verify/:token", verifyEmail);

// ==========================================
// [CLIENT] ROUTES - Yêu cầu đăng nhập
// ==========================================
router.post("/logout", authMiddleware, logout);

module.exports = router;
