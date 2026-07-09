const PayOSModule = require("@payos/node");

const PayOS = PayOSModule.PayOS || PayOSModule.default || PayOSModule;

const readPayosConfig = () => ({
    clientId: (process.env.PAYOS_CLIENT_ID || "").trim(),
    apiKey: (process.env.PAYOS_API_KEY || "").trim(),
    checksumKey: (process.env.PAYOS_CHECKSUM_KEY || "").trim(),
});

class PaymentService {
    constructor() {
        this.client = null;
    }

    getClient() {
        if (this.client) return this.client;

        const config = readPayosConfig();
        const missingKeys = Object.entries(config)
            .filter(([, value]) => !value)
            .map(([key]) => key);

        if (missingKeys.length) {
            throw new Error(`PayOS chua duoc cau hinh: ${missingKeys.join(", ")}`);
        }

        this.client = new PayOS(config);
        return this.client;
    }

    async createPaymentLink(paymentData) {
        const client = this.getClient();

        if (typeof client.createPaymentLink === "function") {
            return client.createPaymentLink(paymentData);
        }

        if (client.paymentRequests && typeof client.paymentRequests.create === "function") {
            return client.paymentRequests.create(paymentData);
        }

        throw new Error("PayOS SDK khong ho tro tao link thanh toan trong phien ban hien tai.");
    }

    async verifyPaymentWebhookData(webhookBody) {
        const client = this.getClient();

        try {
            if (typeof client.verifyPaymentWebhookData === "function") {
                return await client.verifyPaymentWebhookData(webhookBody);
            }

            if (client.webhooks && typeof client.webhooks.verify === "function") {
                return await client.webhooks.verify(webhookBody);
            }

            throw new Error("PayOS SDK does not expose a webhook verification method.");
        } catch (error) {
            const safeMessage = error?.message || "Unknown PayOS webhook verification error";
            console.warn("PayOS webhook verification rejected:", safeMessage);
            const verifyError = new Error("Invalid PayOS webhook signature");
            verifyError.status = 401;
            throw verifyError;
        }
    }

    async cancelPaymentLink(orderCode, cancellationReason) {
        const client = this.getClient();

        if (typeof client.cancelPaymentLink === "function") {
            return client.cancelPaymentLink(Number(orderCode), cancellationReason);
        }

        if (client.paymentRequests && typeof client.paymentRequests.cancel === "function") {
            return client.paymentRequests.cancel(Number(orderCode), cancellationReason);
        }

        console.warn("PayOS cancel is not supported by this SDK version.");
        return true;
    }

    async getPaymentLinkInfo(orderCode) {
        const client = this.getClient();

        if (typeof client.getPaymentLinkInformation === "function") {
            return client.getPaymentLinkInformation(Number(orderCode));
        }

        if (client.paymentRequests && typeof client.paymentRequests.get === "function") {
            return client.paymentRequests.get(Number(orderCode));
        }

        throw new Error("PayOS SDK khong ho tro lay thong tin link thanh toan.");
    }
}

module.exports = new PaymentService();
