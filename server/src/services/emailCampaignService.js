const { Op } = require("sequelize");
const EmailCampaign = require("../models/emailCampaign");
const NewsletterSubscriber = require("../models/newsletterSubscriber");
const User = require("../models/user");
const sendEmail = require("../utils/sendEmail");
const {
    generateAccountMarketingHtml,
    generateMarketingHtml,
} = require("../templates/emailTemplates");

const BATCH_SIZE = Math.min(Math.max(Number(process.env.EMAIL_CAMPAIGN_BATCH_SIZE) || 20, 1), 100);
const BATCH_DELAY_MS = Math.max(Number(process.env.EMAIL_CAMPAIGN_BATCH_DELAY_MS) || 1000, 250);
const POLL_INTERVAL_MS = Math.max(Number(process.env.EMAIL_CAMPAIGN_POLL_MS) || 5000, 1000);

let workerTimer = null;
let workerRunning = false;
let wakeTimer = null;

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

const frontendUrl = () =>
    String(process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");

const newsletterSecret = () => process.env.NEWSLETTER_SECRET || process.env.JWT_SECRET || "dpwood-newsletter";

const createUnsubscribeToken = (subscriber) => {
    const crypto = require("crypto");
    const signature = crypto
        .createHmac("sha256", newsletterSecret())
        .update(`${subscriber.id}:${subscriber.email}`)
        .digest("base64url");
    return `${subscriber.id}.${signature}`;
};

const unsubscribeUrlFor = (subscriber) =>
    `${frontendUrl()}/newsletter/unsubscribe/${encodeURIComponent(createUnsubscribeToken(subscriber))}`;

const baseRecipientWhere = (campaign) => ({
    createdAt: { [Op.lte]: campaign.recipientSnapshotAt || campaign.createdAt },
    ...(campaign.audience === "subscribers" ? { status: "subscribed" } : { isVerified: true }),
});

const loadRecipientBatch = async (campaign) => {
    const Model = campaign.audience === "subscribers" ? NewsletterSubscriber : User;
    const attributes = campaign.audience === "subscribers"
        ? ["id", "email", "status"]
        : ["id", "name", "email"];
    const recipientIds = Array.isArray(campaign.recipientIds) ? campaign.recipientIds : [];

    if (campaign.target !== "all") {
        const ids = recipientIds.slice(campaign.cursorOffset, campaign.cursorOffset + BATCH_SIZE);
        if (!ids.length) return { recipients: [], nextOffset: campaign.cursorOffset, exhausted: true };
        const rows = await Model.findAll({
            where: { ...baseRecipientWhere(campaign), id: { [Op.in]: ids } },
            attributes,
        });
        const byId = new Map(rows.map((row) => [String(row.id), row]));
        return {
            recipients: ids.map((id) => byId.get(String(id))).filter(Boolean),
            requestedCount: ids.length,
            nextOffset: campaign.cursorOffset + ids.length,
            exhausted: campaign.cursorOffset + ids.length >= recipientIds.length,
        };
    }

    const rows = await Model.findAll({
        where: {
            ...baseRecipientWhere(campaign),
            ...(campaign.cursorId ? { id: { [Op.gt]: campaign.cursorId } } : {}),
        },
        attributes,
        order: [["id", "ASC"]],
        limit: BATCH_SIZE,
    });
    return {
        recipients: rows,
        requestedCount: rows.length,
        nextCursor: rows.length ? String(rows[rows.length - 1].id) : campaign.cursorId,
        exhausted: rows.length < BATCH_SIZE,
    };
};

const buildSubscriberMap = async (campaign, recipients) => {
    if (campaign.audience === "subscribers") {
        return new Map(recipients.map((subscriber) => [normalizeEmail(subscriber.email), subscriber]));
    }
    const emails = recipients.map((recipient) => normalizeEmail(recipient.email)).filter(Boolean);
    if (!emails.length) return new Map();
    const rows = await NewsletterSubscriber.findAll({
        where: { email: { [Op.in]: emails }, status: "subscribed" },
    });
    return new Map(rows.map((subscriber) => [normalizeEmail(subscriber.email), subscriber]));
};

const buildRecipientMessage = (campaign, recipient, subscriber) => {
    const html = subscriber
        ? generateMarketingHtml({
            title: campaign.subject,
            preview: campaign.preview,
            contentHtml: campaign.contentHtml,
            unsubscribeUrl: unsubscribeUrlFor(subscriber),
        })
        : generateAccountMarketingHtml({
            title: campaign.subject,
            preview: campaign.preview,
            contentHtml: campaign.contentHtml,
            recipientName: recipient.name,
        });
    return {
        to: recipient.email,
        subject: `[DPWOOD] ${campaign.subject}`,
        content: html,
        subscriber,
    };
};

const sendBatch = async (campaign, recipients, batch) => {
    const subscriberByEmail = await buildSubscriberMap(campaign, recipients);
    const messages = recipients.map((recipient) => buildRecipientMessage(
        campaign,
        recipient,
        subscriberByEmail.get(normalizeEmail(recipient.email)),
    ));
    const idempotencyKey = [
        "campaign",
        campaign.id,
        batch.nextOffset ?? campaign.cursorOffset,
        batch.nextCursor ?? campaign.cursorId ?? "start",
    ].join("-");

    try {
        const result = await sendEmail.batch(messages, { idempotencyKey });
        const successfulSubscribers = messages
            .filter((message, index) => result.results[index]?.status === "fulfilled" && message.subscriber)
            .map((message) => message.subscriber.update({ lastEmailSentAt: new Date() }));
        await Promise.allSettled(successfulSubscribers);

        const rejected = result.results.find((item) => item.status === "rejected");
        return {
            sent: result.sent,
            failed: result.failed,
            lastError: rejected
                ? String(rejected.reason?.message || rejected.reason || "Không thể gửi email").slice(0, 1000)
                : null,
        };
    } catch (error) {
        return {
            sent: 0,
            failed: recipients.length,
            lastError: String(error.message || error || "Không thể gửi email").slice(0, 1000),
        };
    }
};

const processCampaign = async (campaign) => {
    if (campaign.status === "queued") {
        const [claimed] = await EmailCampaign.update(
            { status: "processing", startedAt: campaign.startedAt || new Date() },
            { where: { id: campaign.id, status: "queued" } },
        );
        if (!claimed) return;
        await campaign.reload();
    }

    while (campaign.status === "processing") {
        const batch = await loadRecipientBatch(campaign);
        if (!batch.requestedCount) {
            await EmailCampaign.update(
                { status: "completed", completedAt: new Date() },
                { where: { id: campaign.id, status: "processing" } },
            );
            return;
        }

        const result = await sendBatch(campaign, batch.recipients, batch);
        const missing = Math.max(batch.requestedCount - batch.recipients.length, 0);
        const failed = result.failed + missing;
        const processedCount = campaign.processedCount + batch.requestedCount;
        const update = {
            processedCount,
            sentCount: campaign.sentCount + result.sent,
            failedCount: campaign.failedCount + failed,
            cursorId: batch.nextCursor ?? campaign.cursorId,
            cursorOffset: batch.nextOffset ?? campaign.cursorOffset,
            lastError: result.lastError,
        };

        if (batch.recipients.length > 0 && result.sent === 0 && result.failed === batch.recipients.length) {
            const failedUpdate = {
                ...update,
                status: "failed",
                completedAt: new Date(),
            };
            const [markedFailed] = await EmailCampaign.update(failedUpdate, {
                where: { id: campaign.id, status: "processing" },
            });
            if (!markedFailed) {
                await EmailCampaign.update(update, { where: { id: campaign.id } });
            }
            return;
        }

        const currentStatus = await EmailCampaign.findByPk(campaign.id, { attributes: ["status"] });
        if (!currentStatus || currentStatus.status !== "processing") {
            await EmailCampaign.update(update, { where: { id: campaign.id } });
            return;
        }

        if (batch.exhausted || processedCount >= campaign.totalRecipients) {
            update.status = "completed";
            update.completedAt = new Date();
        }
        const [updated] = await EmailCampaign.update(update, {
            where: { id: campaign.id, status: "processing" },
        });
        if (!updated || update.status === "completed") return;
        await campaign.reload();
        await sleep(BATCH_DELAY_MS);
    }
};

const runWorker = async () => {
    if (workerRunning) return;
    workerRunning = true;
    try {
        const campaign = await EmailCampaign.findOne({
            where: { status: { [Op.in]: ["processing", "queued"] } },
            order: [["createdAt", "ASC"]],
        });
        if (campaign) await processCampaign(campaign);
    } catch (error) {
        console.error("Email campaign worker error:", error.message);
    } finally {
        workerRunning = false;
    }
};

const wakeEmailCampaignWorker = () => {
    if (wakeTimer) return;
    wakeTimer = setTimeout(() => {
        wakeTimer = null;
        void runWorker();
    }, 100);
    wakeTimer.unref?.();
};

const startEmailCampaignWorker = async () => {
    if (workerTimer || process.env.EMAIL_CAMPAIGN_WORKER_ENABLED === "false") return;
    await EmailCampaign.update({ status: "queued" }, { where: { status: "processing" } });
    wakeEmailCampaignWorker();
    workerTimer = setInterval(() => void runWorker(), POLL_INTERVAL_MS);
    workerTimer.unref?.();
};

module.exports = {
    startEmailCampaignWorker,
    wakeEmailCampaignWorker,
};
