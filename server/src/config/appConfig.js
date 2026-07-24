const DEFAULT_FRONTEND_URL = "http://localhost:3000";
const DEFAULT_PRODUCTION_FRONTEND_URL = "https://dpwood.store";
const LOCAL_ORIGINS = Object.freeze([
    DEFAULT_FRONTEND_URL,
    "http://127.0.0.1:3000",
]);
const PRODUCTION_ORIGINS = Object.freeze([
    DEFAULT_PRODUCTION_FRONTEND_URL,
    "https://www.dpwood.store",
]);

const normalizeUrl = (value) => String(value || "").trim().replace(/\/+$/, "");

const getConfiguredFrontendUrl = (fallback = DEFAULT_FRONTEND_URL) => {
    const configured = process.env.FRONTEND_URL || process.env.CLIENT_URL || fallback;
    return normalizeUrl(String(configured).split(",")[0]);
};

const getFrontendUrlFromRequest = (req) => {
    const configuredUrl = getConfiguredFrontendUrl("");
    if (configuredUrl) return configuredUrl;
    const forwardedHost = req.get("x-forwarded-host");
    const forwardedProto = req.get("x-forwarded-proto") || "https";
    if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
    return `${req.protocol}://${req.get("host")}`;
};

const getAllowedOrigins = () => [
    ...new Set([
        ...LOCAL_ORIGINS,
        ...PRODUCTION_ORIGINS,
        ...[process.env.CLIENT_URL, process.env.FRONTEND_URL, process.env.ALLOWED_ORIGINS]
            .filter(Boolean)
            .flatMap((value) => String(value).split(","))
            .map(normalizeUrl)
            .filter(Boolean),
    ]),
];

module.exports = {
    DEFAULT_FRONTEND_URL,
    DEFAULT_PRODUCTION_FRONTEND_URL,
    getConfiguredFrontendUrl,
    getFrontendUrlFromRequest,
    getAllowedOrigins,
    normalizeUrl,
};
