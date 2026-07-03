const nodemailer = require("nodemailer");

const getSmtpConfig = () => {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

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

const buildFallbackSmtpConfig = (config) => {
    if (config.host !== "smtp.gmail.com" || config.port === 465) return null;

    return {
        ...config,
        port: 465,
        secure: true,
        requireTLS: false,
    };
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

    try {
        const transporter = nodemailer.createTransport(smtpConfig);
        const info = await transporter.sendMail(mailOptions);

        console.log(`Email sent to ${to} | MessageID: ${info.messageId}`);
        return true;
    } catch (error) {
        const fallbackConfig = buildFallbackSmtpConfig(smtpConfig);
        const shouldRetry =
            fallbackConfig &&
            ["ETIMEDOUT", "ESOCKET", "ECONNECTION", "ENETUNREACH"].some(
                (code) => error.code === code || String(error.message || "").includes(code),
            );

        if (shouldRetry) {
            try {
                console.warn(`SMTP ${smtpConfig.host}:${smtpConfig.port} failed (${error.message}). Retrying 465.`);
                const fallbackTransporter = nodemailer.createTransport(fallbackConfig);
                const info = await fallbackTransporter.sendMail(mailOptions);
                console.log(`Email sent to ${to} via fallback SMTP | MessageID: ${info.messageId}`);
                return true;
            } catch (fallbackError) {
                console.error("Email fallback send failed:", fallbackError.message);
            }
        } else {
            console.error("Email send failed:", error.message);
        }

        throw new Error("Khong the gui email. Vui long kiem tra cau hinh SMTP hoac thu lai sau.");
    }
};

module.exports = sendEmail;
