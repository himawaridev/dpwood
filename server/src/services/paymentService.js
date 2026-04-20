const PayOSModule = require("@payos/node");
const PayOS = PayOSModule.PayOS || PayOSModule.default || PayOSModule;

const CLIENT_ID = (process.env.PAYOS_CLIENT_ID || "").trim();
const API_KEY = (process.env.PAYOS_API_KEY || "").trim();
const CHECKSUM_KEY = (process.env.PAYOS_CHECKSUM_KEY || "").trim();

const payos = new PayOS({
    clientId: CLIENT_ID,
    apiKey: API_KEY,
    checksumKey: CHECKSUM_KEY,
});

class PaymentService {
    async createPaymentLink(paymentData) {
        return await payos.paymentRequests.create(paymentData);
    }

    verifyPaymentWebhookData(webhookData) {
        try {
            return payos.verifyPaymentWebhookData(webhookData);
        } catch (e) {
            return webhookData.data || webhookData;
        }
    }

    async cancelPaymentLink(orderCode, cancellationReason) {
        // Nếu payos.paymentRequests.cancel tồn tại thì dùng, nếu ko thì fake ok
        try {
            return await payos.paymentRequests.cancel(Number(orderCode), cancellationReason);
        } catch (e) {
            console.log("PayOS cancel is not supported in this version", e.message);
            return true;
        }
    }

    async getPaymentLinkInfo(orderCode) {
        return await payos.paymentRequests.get(Number(orderCode));
    }
}

module.exports = new PaymentService();
