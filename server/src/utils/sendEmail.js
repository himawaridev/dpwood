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
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 30000,
    };
};

const sendEmail = async (to, subject, content) => {
    try {
        const smtpConfig = getSmtpConfig();
        const transporter = nodemailer.createTransport(smtpConfig);
        const isHtml = /<[a-z][\s\S]*>/i.test(content);

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || `"DPWOOD Store" <${smtpConfig.auth.user}>`,
            to,
            subject,
            ...(isHtml ? { html: content } : { text: content }),
        });

        console.log(`Email sent to ${to} | MessageID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error("Email send failed:", error.message);
        throw new Error("Khong the gui email. Vui long kiem tra cau hinh SMTP hoac thu lai sau.");
    }
};

module.exports = sendEmail;
