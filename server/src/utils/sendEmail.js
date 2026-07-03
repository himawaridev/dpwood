const nodemailer = require("nodemailer");
const dns = require("dns").promises;

let preferredSmtpAttempt = null;

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
const hasHtml = (content) => /<[a-z][\s\S]*>/i.test(content);
const getDefaultFrom = (fallbackUser = "") =>
    normalizeValue(process.env.EMAIL_FROM || process.env.RESEND_FROM || process.env.SMTP_FROM) ||
    `"DPWOOD Store" <${fallbackUser || "onboarding@resend.dev"}>`;

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
        tls: {
            servername: host,
        },
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

    if (preferredSmtpAttempt) {
        pushAttempt(preferredSmtpAttempt.host, preferredSmtpAttempt.port);
    }

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
    return `${code}${error.message || "unknown SMTP error"}`.slice(0, 240);
};

const getSafeHttpError = (payload) => {
    if (!payload) return "unknown provider error";
    if (typeof payload === "string") return payload.slice(0, 240);
    return (payload.message || payload.error || JSON.stringify(payload)).slice(0, 240);
};

const sendWithResend = async (to, subject, content) => {
    const apiKey = normalizeValue(process.env.RESEND_API_KEY);
    if (!apiKey) return false;

    const isHtml = hasHtml(content);
    const payload = {
        from: getDefaultFrom(),
        to: [to],
        subject,
        ...(isHtml ? { html: content } : { text: content }),
    };

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "User-Agent": "DPWOOD/1.0",
        },
        body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let responseBody = responseText;
    try {
        responseBody = responseText ? JSON.parse(responseText) : {};
    } catch (_) {
        // Keep raw text for logging.
    }

    if (!response.ok) {
        throw new Error(`Resend ${response.status}: ${getSafeHttpError(responseBody)}`);
    }

    console.log(`Email sent to ${to} via Resend | ID: ${responseBody.id || "unknown"}`);
    return true;
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

    return sendWithSmtp(to, subject, content);
};

module.exports = sendEmail;
