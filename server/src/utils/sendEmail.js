const nodemailer = require("nodemailer");
const dns = require("dns").promises;

const RESEND_API_URL = "https://api.resend.com";
const RESEND_DOMAIN_CACHE_MS = 5 * 60 * 1000;
const MAX_RESEND_ATTEMPTS = 3;
const RESEND_RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

let preferredSmtpAttempt = null;
let resendDomainCache = { expiresAt: 0, domains: null };

const normalizeValue = (value) => String(value || "").trim();
const normalizeHost = (value) => String(value || "smtp.gmail.com").trim().toLowerCase();
const normalizePort = (value) => {
    const port = Number(String(value || 587).trim());
    return Number.isFinite(port) ? port : 587;
};
const normalizeUser = normalizeValue;
const normalizePass = (value, host) => {
    const pass = String(value || "").trim();
    return host === "smtp.gmail.com" ? pass.replace(/\s+/g, "") : pass;
};
const hasHtml = (content) => /<[a-z][\s\S]*>/i.test(String(content || ""));
const sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

const configuredFrom = () =>
    normalizeValue(process.env.EMAIL_FROM || process.env.RESEND_FROM || process.env.SMTP_FROM);

const getDefaultFrom = (fallbackUser = "") =>
    configuredFrom() || `"DPWOOD Store" <${fallbackUser || "onboarding@resend.dev"}>`;

const extractSenderDomain = (from) => {
    const address = String(from || "").match(/<([^>]+)>/)?.[1] || String(from || "");
    return address.split("@")[1]?.trim().toLowerCase() || "";
};

const isResendTestSender = (from) => extractSenderDomain(from) === "resend.dev";

const getSmtpConfig = () => {
    const host = normalizeHost(process.env.SMTP_HOST);
    const port = normalizePort(process.env.SMTP_PORT);
    const user = normalizeUser(process.env.SMTP_USER);
    const pass = normalizePass(process.env.SMTP_PASS, host);

    if (!user || !pass) {
        throw new Error("SMTP_USER or SMTP_PASS is not configured");
    }

    return {
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        family: 4,
        requireTLS: port === 587,
        tls: { servername: host },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 15000,
    };
};

const buildSmtpAttempts = async (config) => {
    const attempts = [];
    const seen = new Set();
    const pushAttempt = (host, port) => {
        const key = `${host}:${port}`;
        if (seen.has(key)) return;
        seen.add(key);
        attempts.push({
            ...config,
            host,
            port,
            secure: port === 465,
            requireTLS: port === 587,
            tls: {
                ...config.tls,
                servername: config.tls?.servername || config.host,
            },
        });
    };

    if (preferredSmtpAttempt) pushAttempt(preferredSmtpAttempt.host, preferredSmtpAttempt.port);

    if (config.host === "smtp.gmail.com") {
        try {
            const ipv4Addresses = await dns.resolve4(config.host);
            for (const host of ipv4Addresses) pushAttempt(host, 465);
            for (const host of ipv4Addresses) pushAttempt(host, 587);
        } catch (error) {
            console.warn(`SMTP DNS IPv4 lookup failed for ${config.host}: ${error.message}`);
        }
        pushAttempt(config.host, 465);
        pushAttempt(config.host, 587);
    } else {
        pushAttempt(config.host, config.port);
    }

    return attempts;
};

const isNetworkSmtpError = (error) =>
    ["ETIMEDOUT", "ESOCKET", "ECONNECTION", "ENETUNREACH", "ECONNREFUSED", "EHOSTUNREACH"].some(
        (code) => error.code === code || String(error.message || "").includes(code),
    );

const getSafeSmtpError = (error) => {
    const code = error.code ? `${error.code}: ` : "";
    return `${code}${error.message || "unknown SMTP error"}`.slice(0, 500);
};

const getSafeHttpError = (payload) => {
    if (!payload) return "unknown provider error";
    if (typeof payload === "string") return payload.slice(0, 500);
    return (payload.message || payload.error || JSON.stringify(payload)).slice(0, 500);
};

const parseResponseBody = async (response) => {
    const responseText = await response.text();
    if (!responseText) return {};
    try {
        return JSON.parse(responseText);
    } catch (_) {
        return responseText;
    }
};

const getRetryDelay = (response, attempt) => {
    const retryAfter = Number(response.headers.get("retry-after"));
    if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1000, 10000);
    return Math.min(500 * (2 ** attempt), 4000);
};

const requestResend = async (path, options = {}, maxAttempts = MAX_RESEND_ATTEMPTS) => {
    const apiKey = normalizeValue(process.env.RESEND_API_KEY);
    if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

    let lastError = null;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
            const response = await fetch(`${RESEND_API_URL}${path}`, {
                ...options,
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "User-Agent": "DPWOOD/1.0",
                    ...(options.headers || {}),
                },
            });
            const responseBody = await parseResponseBody(response);
            if (response.ok) return responseBody;

            const error = new Error(`Resend ${response.status}: ${getSafeHttpError(responseBody)}`);
            error.statusCode = response.status;
            error.providerCode = responseBody?.name || responseBody?.error || null;
            lastError = error;
            if (!RESEND_RETRYABLE_STATUSES.has(response.status) || attempt === maxAttempts - 1) throw error;
            await sleep(getRetryDelay(response, attempt));
        } catch (error) {
            lastError = error;
            const retryableNetworkError = !error.statusCode && attempt < maxAttempts - 1;
            if (!retryableNetworkError) throw error;
            await sleep(Math.min(500 * (2 ** attempt), 4000));
        }
    }
    throw lastError || new Error("Unknown Resend error");
};

const listResendDomains = async ({ force = false } = {}) => {
    if (!force && resendDomainCache.domains && resendDomainCache.expiresAt > Date.now()) {
        return resendDomainCache.domains;
    }
    const response = await requestResend("/domains?limit=100", { method: "GET" }, 1);
    const domains = Array.isArray(response?.data) ? response.data : [];
    resendDomainCache = { domains, expiresAt: Date.now() + RESEND_DOMAIN_CACHE_MS };
    return domains;
};

const isVerifiedDomain = (domain) =>
    domain?.status === "verified"
    || domain?.capabilities?.sending === "enabled" && domain?.status === "partially_verified";

const findVerifiedDomain = (domains, expectedDomain = "") => {
    const verified = domains.filter(isVerifiedDomain);
    if (!expectedDomain) return verified[0] || null;
    return verified.find((domain) => String(domain.name).toLowerCase() === expectedDomain) || null;
};

const resolveResendSender = async ({ requireVerified = false } = {}) => {
    const explicitFrom = configuredFrom();
    const explicitDomain = extractSenderDomain(explicitFrom);
    if (explicitFrom && !isResendTestSender(explicitFrom)) return explicitFrom;

    try {
        const verifiedDomain = findVerifiedDomain(await listResendDomains());
        if (verifiedDomain) return `"DPWOOD Store" <newsletter@${verifiedDomain.name}>`;
    } catch (error) {
        if (requireVerified) {
            throw new Error(
                `Khong the kiem tra mien gui Resend: ${getSafeHttpError(error.message)}. `
                + "Hay dat RESEND_FROM bang dia chi thuoc mien da xac minh.",
            );
        }
    }

    if (requireVerified) {
        throw new Error(
            "Resend chua co mien gui da xac minh. onboarding@resend.dev chi gui duoc toi email chu tai khoan. "
            + "Hay xac minh dpwood.store trong Resend va dat RESEND_FROM=\"DPWOOD Store <newsletter@dpwood.store>\".",
        );
    }
    return explicitFrom || `"DPWOOD Store" <onboarding@resend.dev>`;
};

const getEmailProviderStatus = async () => {
    const hasResend = Boolean(normalizeValue(process.env.RESEND_API_KEY));
    if (!hasResend) {
        const smtpConfigured = Boolean(normalizeValue(process.env.SMTP_USER) && normalizeValue(process.env.SMTP_PASS));
        return {
            provider: "smtp",
            ready: smtpConfigured,
            readyForBulk: smtpConfigured && process.env.NODE_ENV !== "production",
            sender: smtpConfigured ? getDefaultFrom(normalizeValue(process.env.SMTP_USER)) : null,
            message: smtpConfigured
                ? "SMTP da cau hinh. Tren Render nen uu tien Resend de tranh timeout."
                : "Chua cau hinh dich vu gui email.",
        };
    }

    const explicitFrom = configuredFrom();
    const explicitDomain = extractSenderDomain(explicitFrom);
    try {
        const domains = await listResendDomains({ force: true });
        const verifiedDomain = findVerifiedDomain(domains, isResendTestSender(explicitFrom) ? "" : explicitDomain);
        if (verifiedDomain) {
            const sender = explicitFrom && !isResendTestSender(explicitFrom)
                ? explicitFrom
                : `"DPWOOD Store" <newsletter@${verifiedDomain.name}>`;
            return {
                provider: "resend",
                ready: true,
                readyForBulk: true,
                sender,
                domain: verifiedDomain.name,
                message: "Resend va mien gui da san sang.",
            };
        }
        return {
            provider: "resend",
            ready: true,
            readyForBulk: false,
            sender: explicitFrom || `"DPWOOD Store" <onboarding@resend.dev>`,
            message: "Chua co mien Resend da xac minh de gui cho nhieu nguoi nhan.",
        };
    } catch (error) {
        if (explicitFrom && !isResendTestSender(explicitFrom)) {
            return {
                provider: "resend",
                ready: true,
                readyForBulk: true,
                sender: explicitFrom,
                message: "Dang dung RESEND_FROM. API key khong co quyen doc trang thai mien.",
            };
        }
        return {
            provider: "resend",
            ready: true,
            readyForBulk: false,
            sender: explicitFrom || `"DPWOOD Store" <onboarding@resend.dev>`,
            message: `Khong the xac minh mien gui: ${getSafeHttpError(error.message)}`,
        };
    }
};

const sendWithResend = async (to, subject, content) => {
    const from = await resolveResendSender();
    const isHtml = hasHtml(content);
    const responseBody = await requestResend("/emails", {
        method: "POST",
        body: JSON.stringify({
            from,
            to: [to],
            subject,
            ...(isHtml ? { html: content } : { text: content }),
        }),
    });
    console.log(`Email sent to ${to} via Resend | ID: ${responseBody.id || "unknown"}`);
    return true;
};

const sendWithResendBatch = async (messages, { idempotencyKey } = {}) => {
    if (!messages.length) return { sent: 0, failed: 0, results: [] };
    if (messages.length > 100) throw new Error("Resend batch chi ho tro toi da 100 email moi request");

    const from = await resolveResendSender({ requireVerified: true });
    const payload = messages.map(({ to, subject, content }) => ({
        from,
        to: [to],
        subject,
        ...(hasHtml(content) ? { html: content } : { text: content }),
    }));
    const responseBody = await requestResend("/emails/batch", {
        method: "POST",
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey.slice(0, 256) } : {},
        body: JSON.stringify(payload),
    });
    const ids = Array.isArray(responseBody?.data) ? responseBody.data : [];
    console.log(`Email batch accepted by Resend: ${messages.length} email(s)`);
    return {
        sent: messages.length,
        failed: 0,
        results: messages.map((_, index) => ({ status: "fulfilled", id: ids[index]?.id || null })),
    };
};

const sendWithSmtp = async (to, subject, content) => {
    const smtpConfig = getSmtpConfig();
    const isHtml = hasHtml(content);
    const mailOptions = {
        from: getDefaultFrom(smtpConfig.auth.user),
        to,
        subject,
        ...(isHtml ? { html: content } : { text: content }),
    };
    const attempts = await buildSmtpAttempts(smtpConfig);
    let lastError = null;

    for (const attempt of attempts) {
        try {
            console.log(`Trying SMTP ${attempt.host}:${attempt.port} for ${to}`);
            const transporter = nodemailer.createTransport(attempt);
            const info = await transporter.sendMail(mailOptions);
            preferredSmtpAttempt = { host: attempt.host, port: attempt.port };
            console.log(`Email sent to ${to} via ${attempt.host}:${attempt.port} | MessageID: ${info.messageId}`);
            return true;
        } catch (error) {
            lastError = error;
            console.error(`Email send failed via ${attempt.host}:${attempt.port}: ${getSafeSmtpError(error)}`);
            if (!isNetworkSmtpError(error)) break;
        }
    }
    throw new Error(`Khong the gui email qua SMTP. Loi gan nhat: ${getSafeSmtpError(lastError || {})}`);
};

const sendEmail = async (to, subject, content) => {
    if (normalizeValue(process.env.RESEND_API_KEY)) {
        try {
            return await sendWithResend(to, subject, content);
        } catch (error) {
            console.error(`Email send failed via Resend: ${getSafeHttpError(error.message)}`);
            throw new Error(`Khong the gui email qua Resend. Loi: ${getSafeHttpError(error.message)}`);
        }
    }
    if (process.env.NODE_ENV === "production" || normalizeValue(process.env.RENDER)) {
        throw new Error("Chua cau hinh RESEND_API_KEY tren Render nen khong the gui email on dinh.");
    }
    return sendWithSmtp(to, subject, content);
};

const sendEmailBatch = async (messages, options = {}) => {
    if (normalizeValue(process.env.RESEND_API_KEY)) {
        try {
            return await sendWithResendBatch(messages, options);
        } catch (error) {
            console.error(`Email batch failed via Resend: ${getSafeHttpError(error.message)}`);
            throw new Error(`Khong the gui lo email qua Resend. Loi: ${getSafeHttpError(error.message)}`);
        }
    }

    const results = [];
    for (const message of messages) {
        try {
            await sendEmail(message.to, message.subject, message.content);
            results.push({ status: "fulfilled" });
        } catch (error) {
            results.push({ status: "rejected", reason: error });
        }
    }
    const sent = results.filter((result) => result.status === "fulfilled").length;
    return { sent, failed: results.length - sent, results };
};

sendEmail.batch = sendEmailBatch;
sendEmail.getProviderStatus = getEmailProviderStatus;
sendEmail.resolveResendSender = resolveResendSender;

module.exports = sendEmail;
