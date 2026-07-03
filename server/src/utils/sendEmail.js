const nodemailer = require("nodemailer");
const dns = require("dns").promises;

const normalizeHost = (value) => String(value || "smtp.gmail.com").trim().toLowerCase();
const normalizePort = (value) => {
    const port = Number(String(value || 587).trim());
    return Number.isFinite(port) ? port : 587;
};
const normalizeUser = (value) => String(value || "").trim();
const normalizePass = (value, host) => {
    const pass = String(value || "").trim();
    return host === "smtp.gmail.com" ? pass.replace(/\s+/g, "") : pass;
};

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
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 45000,
    };
};

const buildSmtpAttempts = async (config) => {
    const ports = config.host === "smtp.gmail.com" ? [config.port, config.port === 465 ? 587 : 465] : [config.port];
    const hosts = [config.host];

    if (config.host === "smtp.gmail.com") {
        try {
            const ipv4Addresses = await dns.resolve4(config.host);
            hosts.push(...ipv4Addresses);
        } catch (error) {
            console.warn(`SMTP DNS IPv4 lookup failed for ${config.host}: ${error.message}`);
        }
    }

    const seen = new Set();
    const attempts = [];

    for (const host of hosts) {
        for (const port of ports) {
            const key = `${host}:${port}`;
            if (seen.has(key)) continue;
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
        }
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

const sendEmail = async (to, subject, content) => {
    const smtpConfig = getSmtpConfig();
    const isHtml = /<[a-z][\s\S]*>/i.test(content);
    const mailOptions = {
        from: process.env.SMTP_FROM || `"DPWOOD Store" <${smtpConfig.auth.user}>`,
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

module.exports = sendEmail;
