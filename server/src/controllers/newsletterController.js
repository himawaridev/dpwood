const crypto = require("crypto");
const sanitizeHtml = require("sanitize-html");
const { Op } = require("sequelize");
const NewsletterSubscriber = require("../models/newsletterSubscriber");
const EmailCampaign = require("../models/emailCampaign");
const User = require("../models/user");
const Coupon = require("../models/coupon");
const sendEmail = require("../utils/sendEmail");
const {
    generateAccountMarketingHtml,
    generateMarketingHtml,
    generateNewsletterVerificationHtml,
    generateNewsletterWelcomeHtml,
} = require("../templates/emailTemplates");
const { wakeEmailCampaignWorker } = require("../services/emailCampaignService");

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const WELCOME_COUPON_CODE = "DPWOODWELCOME10";
const MAX_WELCOME_RECIPIENTS = 1000;
const MAX_SELECTED_RECIPIENTS = 5000;
const USER_ROLES = ["root", "admin", "staff", "user"];

const frontendUrl = () =>
    String(process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
const hashToken = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");
const createVerificationToken = () => crypto.randomBytes(32).toString("hex");
const newsletterSecret = () => process.env.NEWSLETTER_SECRET || process.env.JWT_SECRET || "dpwood-newsletter";

const createUnsubscribeToken = (subscriber) => {
    const signature = crypto
        .createHmac("sha256", newsletterSecret())
        .update(`${subscriber.id}:${subscriber.email}`)
        .digest("base64url");
    return `${subscriber.id}.${signature}`;
};

const findSubscriberByUnsubscribeToken = async (token) => {
    const [id, signature] = String(token || "").split(".");
    if (!id || !signature) return null;
    const subscriber = await NewsletterSubscriber.findByPk(id);
    if (!subscriber) return null;
    const expected = createUnsubscribeToken(subscriber).split(".")[1];
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
        return null;
    }
    return subscriber;
};

const unsubscribeUrlFor = (subscriber) =>
    `${frontendUrl()}/newsletter/unsubscribe/${encodeURIComponent(createUnsubscribeToken(subscriber))}`;

const sanitizeCampaignHtml = (value) =>
    sanitizeHtml(String(value || ""), {
        allowedTags: ["h2", "h3", "p", "ul", "ol", "li", "strong", "em", "blockquote", "a", "br"],
        allowedAttributes: { a: ["href", "target", "rel"] },
        allowedSchemes: ["http", "https", "mailto"],
        transformTags: {
            a: (tagName, attribs) => ({
                tagName,
                attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer" },
            }),
        },
    });

const ensureWelcomeCoupon = async () => {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    let coupon = await Coupon.findOne({ where: { code: WELCOME_COUPON_CODE } });
    if (!coupon) {
        coupon = await Coupon.create({
            code: WELCOME_COUPON_CODE,
            description: "Mã chào mừng thành viên bản tin DPWOOD",
            discountType: "percent",
            discountValue: 10,
            minOrderAmount: 300000,
            maxDiscountAmount: 100000,
            usageLimit: null,
            startDate: new Date(),
            expiryDate,
            isActive: true,
        });
    } else if (!coupon.isActive || new Date(coupon.expiryDate) <= new Date()) {
        await coupon.update({ isActive: true, expiryDate });
    }
    return coupon;
};

const sendWelcomeOnce = async (subscriber) => {
    const claimedAt = new Date();
    const [claimed] = await NewsletterSubscriber.update(
        { welcomeSentAt: claimedAt },
        { where: { id: subscriber.id, status: "subscribed", welcomeSentAt: null } },
    );
    if (!claimed) return false;

    try {
        const coupon = await ensureWelcomeCoupon();
        const html = generateNewsletterWelcomeHtml({
            couponCode: coupon.code,
            unsubscribeUrl: unsubscribeUrlFor(subscriber),
        });
        await sendEmail(subscriber.email, "[DPWOOD] Chào mừng bạn đến với bản tin", html);
        await NewsletterSubscriber.update({ lastEmailSentAt: new Date() }, { where: { id: subscriber.id } });
        return true;
    } catch (error) {
        await NewsletterSubscriber.update(
            { welcomeSentAt: null },
            { where: { id: subscriber.id, welcomeSentAt: claimedAt } },
        );
        throw error;
    }
};

const sendSubscriberVerification = async (subscriber) => {
    const now = new Date();
    const token = createVerificationToken();
    await subscriber.update({
        status: "pending",
        verificationTokenHash: hashToken(token),
        verificationExpiresAt: new Date(now.getTime() + VERIFICATION_TTL_MS),
        verificationSentAt: now,
        unsubscribedAt: null,
    });

    const verificationUrl = `${frontendUrl()}/newsletter/confirm/${token}`;
    await sendEmail(
        subscriber.email,
        "[DPWOOD] Xác nhận đăng ký nhận bản tin",
        generateNewsletterVerificationHtml(verificationUrl),
    );
};

const subscribe = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        if (!isValidEmail(email)) return res.status(400).json({ message: "Địa chỉ email không hợp lệ" });

        let subscriber = await NewsletterSubscriber.findOne({ where: { email } });
        if (subscriber?.status === "subscribed") {
            return res.status(200).json({ message: "Email này đã đăng ký nhận bản tin" });
        }

        const now = new Date();
        if (
            subscriber?.verificationSentAt
            && now.getTime() - new Date(subscriber.verificationSentAt).getTime() < RESEND_COOLDOWN_MS
        ) {
            return res.status(429).json({ message: "Vui lòng đợi 60 giây trước khi gửi lại email xác nhận" });
        }

        if (!subscriber) subscriber = await NewsletterSubscriber.create({ email, status: "pending" });
        await sendSubscriberVerification(subscriber);
        return res.status(200).json({ message: "Hãy kiểm tra email để xác nhận đăng ký" });
    } catch (error) {
        console.error("newsletter subscribe error:", error.message);
        return res.status(502).json({ message: "Chưa thể gửi email xác nhận. Vui lòng thử lại sau." });
    }
};

const confirmSubscription = async (req, res) => {
    try {
        const subscriber = await NewsletterSubscriber.findOne({
            where: { verificationTokenHash: hashToken(req.params.token) },
        });
        if (!subscriber) return res.status(400).json({ message: "Liên kết xác nhận không hợp lệ" });
        if (!subscriber.verificationExpiresAt || new Date(subscriber.verificationExpiresAt) < new Date()) {
            return res.status(400).json({ message: "Liên kết xác nhận đã hết hạn. Vui lòng đăng ký lại." });
        }

        await subscriber.update({
            status: "subscribed",
            verifiedAt: subscriber.verifiedAt || new Date(),
            verificationTokenHash: null,
            verificationExpiresAt: null,
        });
        void sendWelcomeOnce(subscriber).catch((error) => {
            console.error(`newsletter welcome email failed for subscriber ${subscriber.id}:`, error.message);
        });
        return res.status(200).json({
            message: "Đăng ký bản tin thành công. Thư chào mừng và mã ưu đãi sẽ được gửi qua email.",
        });
    } catch (error) {
        console.error("newsletter confirm error:", error.message);
        return res.status(500).json({ message: "Không thể hoàn tất đăng ký bản tin lúc này" });
    }
};

const resendSubscriberVerification = async (req, res) => {
    try {
        const subscriber = await NewsletterSubscriber.findByPk(req.params.id);
        if (!subscriber) return res.status(404).json({ message: "Không tìm thấy đăng ký bản tin" });
        if (subscriber.status === "subscribed") {
            return res.status(409).json({ message: "Email này đã xác nhận đăng ký bản tin" });
        }

        const now = new Date();
        if (
            subscriber.verificationSentAt
            && now.getTime() - new Date(subscriber.verificationSentAt).getTime() < RESEND_COOLDOWN_MS
        ) {
            const retryAfter = Math.ceil(
                (RESEND_COOLDOWN_MS - (now.getTime() - new Date(subscriber.verificationSentAt).getTime())) / 1000,
            );
            return res.status(429).json({
                message: `Vui lòng đợi ${retryAfter} giây trước khi gửi lại email xác nhận`,
                retryAfter,
            });
        }

        await sendSubscriberVerification(subscriber);
        return res.status(200).json({ message: `Đã gửi lại email xác nhận tới ${subscriber.email}` });
    } catch (error) {
        console.error("newsletter admin resend verification error:", error.message);
        return res.status(502).json({ message: "Không thể gửi lại email xác nhận. Vui lòng thử lại sau." });
    }
};

const deleteSubscriber = async (req, res) => {
    try {
        const subscriber = await NewsletterSubscriber.findByPk(req.params.id);
        if (!subscriber) return res.status(404).json({ message: "Không tìm thấy đăng ký bản tin" });

        await subscriber.destroy();
        return res.status(200).json({ message: `Đã xóa ${subscriber.email} khỏi danh sách bản tin` });
    } catch (error) {
        return res.status(500).json({ message: "Không thể xóa đăng ký bản tin", error: error.message });
    }
};

const unsubscribe = async (req, res) => {
    try {
        const subscriber = await findSubscriberByUnsubscribeToken(req.params.token);
        if (!subscriber) return res.status(400).json({ message: "Liên kết hủy đăng ký không hợp lệ" });
        if (subscriber.status !== "unsubscribed") {
            await subscriber.update({ status: "unsubscribed", unsubscribedAt: new Date() });
        }
        return res.status(200).json({ message: "Bạn đã hủy đăng ký bản tin DPWOOD" });
    } catch (error) {
        console.error("newsletter unsubscribe error:", error.message);
        return res.status(500).json({ message: "Không thể hủy đăng ký lúc này" });
    }
};

const getVerifiedRecipients = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
        const search = String(req.query.search || "").trim();
        const role = USER_ROLES.includes(req.query.role) ? req.query.role : null;
        const where = {
            isVerified: true,
            ...(role ? { role } : {}),
            ...(search
                ? {
                    [Op.or]: [
                        { name: { [Op.like]: `%${search}%` } },
                        { email: { [Op.like]: `%${search}%` } },
                    ],
                }
                : {}),
        };
        const { rows, count } = await User.findAndCountAll({
            where,
            attributes: ["id", "name", "email", "role", "isVerified", "createdAt"],
            order: [["createdAt", "DESC"]],
            limit,
            offset: (page - 1) * limit,
        });
        const emails = rows.map((user) => normalizeEmail(user.email));
        const subscriptions = emails.length
            ? await NewsletterSubscriber.findAll({ where: { email: { [Op.in]: emails } } })
            : [];
        const subscriptionByEmail = new Map(subscriptions.map((item) => [normalizeEmail(item.email), item.status]));
        const users = rows.map((user) => ({
            ...user.toJSON(),
            newsletterStatus: subscriptionByEmail.get(normalizeEmail(user.email)) || null,
        }));
        const [verifiedUsers, subscribedNewsletter] = await Promise.all([
            User.count({ where: { isVerified: true } }),
            NewsletterSubscriber.count({ where: { status: "subscribed" } }),
        ]);
        return res.status(200).json({
            users,
            total: count,
            page,
            limit,
            stats: { verifiedUsers, subscribedNewsletter },
        });
    } catch (error) {
        return res.status(500).json({ message: "Không thể tải danh sách tài khoản đã xác minh", error: error.message });
    }
};

const getSubscribers = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
        const status = ["pending", "subscribed", "unsubscribed"].includes(req.query.status)
            ? req.query.status
            : null;
        const search = normalizeEmail(req.query.search);
        const where = {
            ...(status ? { status } : {}),
            ...(search ? { email: { [Op.like]: `%${search}%` } } : {}),
        };
        const { rows, count } = await NewsletterSubscriber.findAndCountAll({
            where,
            order: [["createdAt", "DESC"]],
            limit,
            offset: (page - 1) * limit,
            attributes: { exclude: ["verificationTokenHash"] },
        });
        const counts = await Promise.all(
            ["pending", "subscribed", "unsubscribed"].map(async (item) => [
                item,
                await NewsletterSubscriber.count({ where: { status: item } }),
            ]),
        );
        return res.status(200).json({
            subscribers: rows,
            total: count,
            page,
            limit,
            stats: Object.fromEntries(counts),
        });
    } catch (error) {
        return res.status(500).json({ message: "Không thể tải danh sách đăng ký", error: error.message });
    }
};

const resolveCampaignDefinition = async ({ audience, target, userId, userIds, subscriberId, snapshotAt }) => {
    const Model = audience === "subscribers" ? NewsletterSubscriber : User;
    const baseWhere = {
        ...(audience === "subscribers" ? { status: "subscribed" } : { isVerified: true }),
        createdAt: { [Op.lte]: snapshotAt },
    };

    if (target === "all") {
        return { recipientIds: null, totalRecipients: await Model.count({ where: baseWhere }) };
    }

    const requestedIds = target === "individual"
        ? [audience === "subscribers" ? subscriberId : userId]
        : [...new Set(Array.isArray(userIds) ? userIds.filter(Boolean) : [])];
    if (!requestedIds.length) return { recipientIds: [], totalRecipients: 0 };
    if (requestedIds.length > MAX_SELECTED_RECIPIENTS) {
        const error = new Error(
            `Chỉ được chọn tối đa ${MAX_SELECTED_RECIPIENTS} tài khoản riêng lẻ. Hãy dùng lựa chọn gửi toàn bộ.`,
        );
        error.statusCode = 400;
        throw error;
    }

    const rows = await Model.findAll({
        where: { ...baseWhere, id: { [Op.in]: requestedIds } },
        attributes: ["id"],
    });
    const validIds = rows.map((row) => String(row.id));
    return { recipientIds: validIds, totalRecipients: validIds.length };
};

const sendCampaign = async (req, res) => {
    try {
        const audience = req.body.audience === "subscribers" ? "subscribers" : "verified_users";
        const target = ["individual", "selected", "all"].includes(req.body.target) ? req.body.target : "all";
        const subject = String(req.body.subject || "").trim().slice(0, 180);
        const preview = String(req.body.preview || "").trim().slice(0, 240);
        const contentHtml = sanitizeCampaignHtml(req.body.contentHtml);
        if (!subject || !contentHtml) {
            return res.status(400).json({ message: "Tiêu đề và nội dung email là bắt buộc" });
        }
        if (audience === "subscribers" && target === "selected") {
            return res.status(400).json({ message: "Nhóm được chọn chỉ áp dụng cho danh sách tài khoản" });
        }

        const providerStatus = await sendEmail.getProviderStatus();
        if (!providerStatus.readyForBulk) {
            return res.status(503).json({
                message: providerStatus.message,
                provider: providerStatus.provider,
                sender: providerStatus.sender,
            });
        }

        const recipientSnapshotAt = new Date();
        const definition = await resolveCampaignDefinition({
            audience,
            target,
            userId: req.body.userId,
            userIds: req.body.userIds,
            subscriberId: req.body.subscriberId,
            snapshotAt: recipientSnapshotAt,
        });
        if (!definition.totalRecipients) {
            return res.status(404).json({ message: "Không tìm thấy người nhận phù hợp" });
        }

        const campaign = await EmailCampaign.create({
            audience,
            target,
            recipientIds: definition.recipientIds,
            subject,
            preview,
            contentHtml,
            totalRecipients: definition.totalRecipients,
            recipientSnapshotAt,
            createdBy: req.user.id,
        });
        wakeEmailCampaignWorker();

        return res.status(202).json({
            message: `Đã xếp hàng chiến dịch cho ${definition.totalRecipients} người nhận`,
            campaign: {
                id: campaign.id,
                status: campaign.status,
                totalRecipients: campaign.totalRecipients,
            },
        });
    } catch (error) {
        console.error("newsletter campaign error:", error.message);
        return res.status(error.statusCode || 500).json({
            message: error.message || "Không thể tạo chiến dịch email",
        });
    }
};

const getEmailProviderStatus = async (req, res) => {
    try {
        const status = await sendEmail.getProviderStatus();
        return res.status(200).json(status);
    } catch (error) {
        return res.status(503).json({
            provider: process.env.RESEND_API_KEY ? "resend" : "smtp",
            ready: false,
            readyForBulk: false,
            message: error.message || "Không thể kiểm tra dịch vụ email",
        });
    }
};

const sendTestEmail = async (req, res) => {
    try {
        const email = normalizeEmail(req.user?.email);
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: "Tài khoản quản trị chưa có email hợp lệ" });
        }
        const html = generateAccountMarketingHtml({
            title: "Kiểm tra hệ thống email DPWOOD",
            preview: "Email thử từ trang quản trị DPWOOD",
            contentHtml: [
                "<h2>Hệ thống email đang hoạt động</h2>",
                "<p>Đây là email kiểm tra được gửi từ trang quản trị DPWOOD.</p>",
                `<p>Thời gian kiểm tra: <strong>${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</strong></p>`,
            ].join(""),
            recipientName: req.user?.name || "Quản trị viên DPWOOD",
        });
        await sendEmail(email, "[DPWOOD] Kiểm tra hệ thống email", html);
        return res.status(200).json({ message: `Đã gửi email thử tới ${email}` });
    } catch (error) {
        console.error("newsletter test email error:", error.message);
        return res.status(502).json({ message: error.message || "Không thể gửi email thử" });
    }
};

const previewCampaign = async (req, res) => {
    try {
        const audience = req.body.audience === "subscribers" ? "subscribers" : "verified_users";
        const subject = String(req.body.subject || "").trim().slice(0, 180);
        const preview = String(req.body.preview || "").trim().slice(0, 240);
        const contentHtml = sanitizeCampaignHtml(req.body.contentHtml);
        if (!subject || !contentHtml) {
            return res.status(400).json({ message: "Tiêu đề và nội dung email là bắt buộc" });
        }

        const html = audience === "subscribers"
            ? generateMarketingHtml({
                title: subject,
                preview,
                contentHtml,
                unsubscribeUrl: `${frontendUrl()}/newsletter/unsubscribe/demo-preview`,
            })
            : generateAccountMarketingHtml({
                title: subject,
                preview,
                contentHtml,
                recipientName: String(req.body.recipientName || "Khách hàng DPWOOD").trim().slice(0, 120),
            });

        return res.status(200).json({ html });
    } catch (error) {
        return res.status(500).json({ message: "Không thể tạo bản xem trước email", error: error.message });
    }
};

const getCampaigns = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
        const allowedStatuses = ["queued", "processing", "completed", "failed", "cancelled"];
        const status = allowedStatuses.includes(req.query.status) ? req.query.status : null;
        const { rows, count } = await EmailCampaign.findAndCountAll({
            where: status ? { status } : {},
            attributes: { exclude: ["contentHtml", "recipientIds", "cursorId", "cursorOffset"] },
            order: [["createdAt", "DESC"]],
            limit,
            offset: (page - 1) * limit,
        });
        return res.status(200).json({ campaigns: rows, total: count, page, limit });
    } catch (error) {
        return res.status(500).json({ message: "Không thể tải lịch sử chiến dịch", error: error.message });
    }
};

const cancelCampaign = async (req, res) => {
    try {
        const [cancelled] = await EmailCampaign.update(
            { status: "cancelled", completedAt: new Date() },
            {
                where: {
                    id: req.params.id,
                    status: { [Op.in]: ["queued", "processing"] },
                },
            },
        );
        if (cancelled) {
            return res.status(200).json({ message: "Đã hủy chiến dịch email" });
        }

        const campaign = await EmailCampaign.findByPk(req.params.id, { attributes: ["id", "status"] });
        if (!campaign) return res.status(404).json({ message: "Không tìm thấy chiến dịch" });
        if (!["queued", "processing"].includes(campaign.status)) {
            return res.status(409).json({ message: "Chiến dịch này không còn có thể hủy" });
        }
        return res.status(409).json({ message: "Không thể hủy chiến dịch lúc này" });
    } catch (error) {
        return res.status(500).json({ message: "Không thể hủy chiến dịch", error: error.message });
    }
};

const resendCampaign = async (req, res) => {
    try {
        const original = await EmailCampaign.findByPk(req.params.id);
        if (!original) return res.status(404).json({ message: "Không tìm thấy chiến dịch" });
        if (["queued", "processing"].includes(original.status)) {
            return res.status(409).json({ message: "Chiến dịch đang được gửi và chưa thể gửi lại" });
        }

        const providerStatus = await sendEmail.getProviderStatus();
        if (!providerStatus.readyForBulk) {
            return res.status(503).json({
                message: providerStatus.message,
                provider: providerStatus.provider,
                sender: providerStatus.sender,
            });
        }

        const recipientSnapshotAt = new Date();
        const recipientIds = Array.isArray(original.recipientIds) ? original.recipientIds : [];
        const definition = await resolveCampaignDefinition({
            audience: original.audience,
            target: original.target,
            userId: original.audience === "verified_users" ? recipientIds[0] : undefined,
            userIds: original.target === "selected" ? recipientIds : undefined,
            subscriberId: original.audience === "subscribers" ? recipientIds[0] : undefined,
            snapshotAt: recipientSnapshotAt,
        });
        if (!definition.totalRecipients) {
            return res.status(404).json({ message: "Không còn người nhận hợp lệ để gửi lại chiến dịch" });
        }

        const campaign = await EmailCampaign.create({
            audience: original.audience,
            target: original.target,
            recipientIds: definition.recipientIds,
            subject: original.subject,
            preview: original.preview,
            contentHtml: original.contentHtml,
            totalRecipients: definition.totalRecipients,
            recipientSnapshotAt,
            createdBy: req.user.id,
        });
        wakeEmailCampaignWorker();

        return res.status(202).json({
            message: `Đã xếp hàng gửi lại cho ${definition.totalRecipients} người nhận`,
            campaign: {
                id: campaign.id,
                status: campaign.status,
                totalRecipients: campaign.totalRecipients,
            },
        });
    } catch (error) {
        console.error("newsletter resend campaign error:", error.message);
        return res.status(error.statusCode || 500).json({
            message: error.message || "Không thể gửi lại chiến dịch email",
        });
    }
};

const deleteCampaign = async (req, res) => {
    try {
        const deleted = await EmailCampaign.destroy({
            where: {
                id: req.params.id,
                status: { [Op.in]: ["completed", "failed", "cancelled"] },
            },
        });
        if (deleted) return res.status(200).json({ message: "Đã xóa lịch sử chiến dịch email" });

        const campaign = await EmailCampaign.findByPk(req.params.id, { attributes: ["id", "status"] });
        if (!campaign) return res.status(404).json({ message: "Không tìm thấy chiến dịch" });
        return res.status(409).json({ message: "Hãy hủy hoặc chờ chiến dịch gửi xong trước khi xóa" });
    } catch (error) {
        return res.status(500).json({ message: "Không thể xóa lịch sử chiến dịch", error: error.message });
    }
};

const sendPendingWelcomeEmails = async (req, res) => {
    try {
        const recipients = await NewsletterSubscriber.findAll({
            where: { status: "subscribed", welcomeSentAt: null },
            limit: MAX_WELCOME_RECIPIENTS,
        });
        let sent = 0;
        const failed = [];
        for (const subscriber of recipients) {
            try {
                if (await sendWelcomeOnce(subscriber)) sent += 1;
            } catch (_) {
                failed.push(subscriber.email);
            }
        }
        return res.status(200).json({
            message: `Đã gửi ${sent} email chào mừng còn thiếu`,
            sent,
            failed,
        });
    } catch (error) {
        return res.status(500).json({ message: "Không thể gửi email chào mừng", error: error.message });
    }
};

module.exports = {
    subscribe,
    confirmSubscription,
    unsubscribe,
    resendSubscriberVerification,
    deleteSubscriber,
    getVerifiedRecipients,
    getSubscribers,
    getEmailProviderStatus,
    sendTestEmail,
    previewCampaign,
    sendCampaign,
    getCampaigns,
    cancelCampaign,
    resendCampaign,
    deleteCampaign,
    sendPendingWelcomeEmails,
};
