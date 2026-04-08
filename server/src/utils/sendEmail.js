// const nodemailer = require("nodemailer");

// const sendEmail = async (to, subject, text) => {
//     try {
//         // 1. Khởi tạo transporter với cấu hình từ .env
//         const transporter = nodemailer.createTransport({
//             host: process.env.SMTP_HOST,
//             port: process.env.SMTP_PORT,
//             secure: process.env.SMTP_PORT == 465, // Sẽ là true nếu dùng port 465 (SSL), false nếu dùng 587 (TLS)
//             auth: {
//                 user: process.env.SMTP_USER,
//                 pass: process.env.SMTP_PASS,
//             },
//         });

//         // 2. Thực hiện gửi email
//         const info = await transporter.sendMail({
//             from: `"DPWOOD System" <${process.env.SMTP_USER}>`, // Thêm tên hiển thị cho đẹp, thay vì chỉ hiện địa chỉ email
//             to: to,
//             subject: subject,
//             text: text,
//             // html: `<p>${text}</p>` // (Tùy chọn) Sau này bạn có thể dùng html để gửi email có định dạng đẹp hơn
//         });

//         // 3. Log ra console để dễ debug khi server đang chạy
//         console.log(`✅ Email sent successfully to ${to} | MessageID: ${info.messageId}`);
//         return true;
//     } catch (error) {
//         // 4. Bắt lỗi và log ra nếu gửi thất bại
//         console.error("❌ Error sending email: ", error.message);
//         throw new Error("Không thể gửi email lúc này. Vui lòng thử lại sau.");
//     }
// };

// module.exports = sendEmail;
const nodemailer = require("nodemailer");

// Tham số thứ 3 đổi tên chung thành 'content'
const sendEmail = async (to, subject, content) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT == 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // 🔴 TỰ ĐỘNG NHẬN DIỆN: Kiểm tra xem content có chứa thẻ HTML không (ví dụ: <div>, <b>, <br>)
        const isHtml = /<[a-z][\s\S]*>/i.test(content);

        // Đóng gói cấu hình email thông minh
        const mailOptions = {
            from: `"DPWOOD Store" <${process.env.SMTP_USER}>`,
            to: to,
            subject: subject,
            // Nếu là HTML thì gán vào thuộc tính 'html', nếu chữ thuần thì gán vào 'text'
            ...(isHtml ? { html: content } : { text: content }),
        };

        const info = await transporter.sendMail(mailOptions);

        console.log(`✅ Đã gửi Email tới ${to} | MessageID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error("❌ Lỗi gửi email: ", error.message);
        return false;
    }
};

module.exports = sendEmail;
