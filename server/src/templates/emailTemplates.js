const brand = {
    name: "DPWOOD",
    primary: "#f09b90",
    ink: "#171717",
    muted: "#747474",
    line: "#ebebeb",
    paper: "#f8f8f8",
};

const frontendUrl = () =>
    (process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");

const formatCurrency = (value) =>
    `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))} d`;

const escapeHtml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

const emailShell = ({ eyebrow, title, preview, children, cta, note }) => `
<!doctype html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0; padding:0; background:${brand.paper}; color:${brand.ink}; font-family:Arial, Helvetica, sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(preview || title)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${brand.paper}; padding:28px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; background:#ffffff; border:1px solid ${brand.line}; border-collapse:collapse;">
                    <tr>
                        <td style="padding:26px 30px 22px; border-bottom:1px solid ${brand.line};">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td>
                                        <div style="display:inline-block; width:44px; height:44px; line-height:44px; text-align:center; background:${brand.primary}; color:#fff; font-size:26px; font-weight:700; font-style:italic; vertical-align:middle;">D</div>
                                        <span style="display:inline-block; margin-left:12px; color:${brand.ink}; font-size:22px; font-weight:800; letter-spacing:.5px; vertical-align:middle;">${brand.name}</span>
                                    </td>
                                    <td align="right" style="color:${brand.muted}; font-size:12px; text-transform:uppercase; letter-spacing:1.8px;">${escapeHtml(eyebrow)}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:34px 30px 30px;">
                            <h1 style="margin:0 0 14px; color:${brand.ink}; font-size:28px; line-height:1.25; font-weight:800;">${escapeHtml(title)}</h1>
                            <div style="color:${brand.muted}; font-size:15px; line-height:1.7;">${children}</div>
                            ${
                                cta
                                    ? `<div style="margin:28px 0 6px;">
                                        <a href="${cta.href}" style="display:inline-block; padding:14px 24px; background:${brand.primary}; color:#ffffff; text-decoration:none; font-size:14px; font-weight:800; letter-spacing:.3px; text-transform:uppercase;">${escapeHtml(cta.label)}</a>
                                    </div>
                                    <p style="margin:14px 0 0; color:${brand.muted}; font-size:12px; line-height:1.6;">Neu nut khong hoat dong, hay copy lien ket nay vao trinh duyet:<br/><a href="${cta.href}" style="color:${brand.primary}; word-break:break-all;">${cta.href}</a></p>`
                                    : ""
                            }
                            ${
                                note
                                    ? `<div style="margin-top:26px; padding:14px 16px; background:${brand.paper}; border-left:4px solid ${brand.primary}; color:${brand.muted}; font-size:13px; line-height:1.6;">${note}</div>`
                                    : ""
                            }
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:18px 30px; border-top:1px solid ${brand.line}; color:${brand.muted}; font-size:12px; line-height:1.6;">
                            Email nay duoc gui tu he thong ${brand.name}. Vui long khong tra loi truc tiep email nay.
                            <br/>${frontendUrl()}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

const generateVerificationHtml = (name, link) =>
    emailShell({
        eyebrow: "Verify email",
        title: "Xac minh tai khoan DPWOOD",
        preview: "Hoan tat dang ky tai khoan DPWOOD cua ban.",
        children: `
            <p style="margin:0 0 12px;">Xin chao <strong style="color:${brand.ink};">${escapeHtml(name || "ban")}</strong>,</p>
            <p style="margin:0;">Cam on ban da dang ky tai khoan tai DPWOOD. Hay xac minh email de kich hoat tai khoan va bat dau mua sam.</p>
        `,
        cta: { href: link, label: "Xac minh tai khoan" },
        note: "Lien ket xac minh chi nen duoc mo boi chinh ban. Neu ban khong tao tai khoan, hay bo qua email nay.",
    });

const generateResetPasswordHtml = (link) =>
    emailShell({
        eyebrow: "Password reset",
        title: "Dat lai mat khau",
        preview: "Lien ket dat lai mat khau DPWOOD co hieu luc trong 60 phut.",
        children: `
            <p style="margin:0 0 12px;">Chung toi nhan duoc yeu cau dat lai mat khau cho tai khoan DPWOOD cua ban.</p>
            <p style="margin:0;">Neu day la yeu cau cua ban, hay tao mat khau moi trong vong <strong style="color:${brand.ink};">60 phut</strong>.</p>
        `,
        cta: { href: link, label: "Dat lai mat khau" },
        note: "Neu ban khong yeu cau dat lai mat khau, hay bo qua email nay. Tai khoan cua ban van an toan.",
    });

const generateOrderHtml = (orderInfo, orderItems = [], isPaid = false) => {
    const itemsHtml = orderItems
        .map((item) => {
            const name = escapeHtml(item.name || item.Product?.name || "San pham");
            const quantity = Number(item.quantity || 0);
            const unitPrice = Number(item.price || item.priceAtPurchase || 0);

            return `
                <tr>
                    <td style="padding:13px 0; border-bottom:1px solid ${brand.line}; color:${brand.ink};">${name}</td>
                    <td style="padding:13px 8px; border-bottom:1px solid ${brand.line}; text-align:center; color:${brand.muted};">${quantity}</td>
                    <td style="padding:13px 0; border-bottom:1px solid ${brand.line}; text-align:right; color:${brand.ink}; font-weight:700;">${formatCurrency(unitPrice * quantity)}</td>
                </tr>
            `;
        })
        .join("");

    const statusLabel = isPaid ? "Da thanh toan" : "Cho thanh toan";
    const statusColor = isPaid ? "#16a34a" : brand.primary;

    return emailShell({
        eyebrow: "Order confirmation",
        title: `Xac nhan don hang #${escapeHtml(orderInfo.orderCode)}`,
        preview: `DPWOOD da ghi nhan don hang #${orderInfo.orderCode}.`,
        children: `
            <p style="margin:0 0 12px;">Xin chao <strong style="color:${brand.ink};">${escapeHtml(orderInfo.customerName || "Quy khach")}</strong>,</p>
            <p style="margin:0 0 20px;">Cam on ban da mua sam tai DPWOOD. Don hang cua ban da duoc ghi nhan thanh cong.</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${brand.paper}; border:1px solid ${brand.line}; margin:0 0 22px;">
                <tr>
                    <td style="padding:16px; color:${brand.muted}; font-size:13px; line-height:1.7;">
                        <strong style="color:${brand.ink};">Nguoi nhan:</strong> ${escapeHtml(orderInfo.shippingName || "")} - ${escapeHtml(orderInfo.shippingPhone || "")}<br/>
                        <strong style="color:${brand.ink};">Dia chi:</strong> ${escapeHtml(orderInfo.shippingAddress || "")}<br/>
                        <strong style="color:${brand.ink};">Trang thai:</strong> <span style="display:inline-block; padding:4px 9px; background:${statusColor}; color:#fff; font-size:11px; font-weight:800; text-transform:uppercase;">${statusLabel}</span>
                    </td>
                </tr>
            </table>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <thead>
                    <tr>
                        <th align="left" style="padding:0 0 10px; color:${brand.muted}; font-size:12px; text-transform:uppercase; letter-spacing:1px; border-bottom:2px solid ${brand.ink};">San pham</th>
                        <th align="center" style="padding:0 8px 10px; color:${brand.muted}; font-size:12px; text-transform:uppercase; letter-spacing:1px; border-bottom:2px solid ${brand.ink};">SL</th>
                        <th align="right" style="padding:0 0 10px; color:${brand.muted}; font-size:12px; text-transform:uppercase; letter-spacing:1px; border-bottom:2px solid ${brand.ink};">Thanh tien</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
                <tfoot>
                    <tr>
                        <td colspan="2" style="padding:18px 8px 0 0; text-align:right; color:${brand.ink}; font-weight:800;">Tong thanh toan</td>
                        <td style="padding:18px 0 0; text-align:right; color:${brand.primary}; font-size:20px; font-weight:900;">${formatCurrency(orderInfo.totalAmount)}</td>
                    </tr>
                </tfoot>
            </table>
        `,
        note: "DPWOOD se cap nhat trang thai don hang qua tai khoan va email cua ban.",
    });
};

module.exports = {
    generateVerificationHtml,
    generateResetPasswordHtml,
    generateOrderHtml,
};
