const generateOrderHtml = (orderInfo, orderItems, isPaid) => {
    const itemsHtml = orderItems
        .map(
            (item) => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #cf1322;">
                ${new Intl.NumberFormat("vi-VN").format(item.price * item.quantity)}₫
            </td>
        </tr>
    `,
        )
        .join("");

    const statusBadge = isPaid
        ? `<span style="background: #52c41a; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">ĐÃ THANH TOÁN (QR)</span>`
        : `<span style="background: #1677ff; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">CHỜ THANH TOÁN KHI NHẬN HÀNG (COD)</span>`;

    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #001529; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">DPWOOD</h1>
                <p style="margin: 5px 0 0 0; color: #aaa;">Xác nhận đơn hàng #${orderInfo.orderCode}</p>
            </div>
            <div style="padding: 20px;">
                <p>Xin chào <strong>${orderInfo.customerName}</strong>,</p>
                <p>Cảm ơn bạn đã mua sắm tại DPWOOD. Đơn hàng của bạn đã được ghi nhận thành công!</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Người nhận:</strong> ${orderInfo.shippingName} - ${orderInfo.shippingPhone}</p>
                    <p style="margin: 5px 0;"><strong>Địa chỉ:</strong> ${orderInfo.shippingAddress}</p>
                    <p style="margin: 5px 0;"><strong>Trạng thái:</strong> ${statusBadge}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead><tr style="background-color: #fafafa;"><th style="text-align: left;">Sản phẩm</th><th>SL</th><th style="text-align: right;">Thành tiền</th></tr></thead>
                    <tbody>${itemsHtml}</tbody>
                    <tfoot><tr><td colspan="2" style="text-align: right; font-weight: bold;">Tổng thanh toán:</td><td style="text-align: right; font-weight: bold; font-size: 18px; color: #cf1322;">${new Intl.NumberFormat("vi-VN").format(orderInfo.totalAmount)}₫</td></tr></tfoot>
                </table>
            </div>
        </div>
    `;
};

module.exports = { generateOrderHtml };
