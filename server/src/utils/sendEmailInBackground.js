const sendEmail = require("./sendEmail");

const sendEmailInBackground = (to, subject, content, context = "notification") => {
    if (!to) return;

    void sendEmail(to, subject, content).catch((error) => {
        console.error(`Background email failed (${context}) for ${to}:`, error.message);
    });
};

module.exports = sendEmailInBackground;
